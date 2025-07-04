import { Response } from 'express';
import { z } from 'zod';
import pool, { query } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { startCampaignProcessing } from '../services/campaignService'; 
// We will create this service in a future step. This import is a placeholder for now.
// import { startCampaignProcessing } from '../services/campaignService'; 

// --- NEW: Advanced Validation Schemas ---

// Schema for a single message object (text, image, or audio)
const messageObjectSchema = z.object({
  type: z.enum(['text', 'image', 'audio']),
  content: z.string().optional(), // For text messages
  url: z.string().url({ message: "Invalid URL format for media." }).optional(), // For media messages
  caption: z.string().optional(), // For image captions
}).refine(data => {
    // Custom validation logic for message types
    if (data.type === 'text') return !!data.content && data.content.length > 0;
    if (data.type === 'image' || data.type === 'audio') return !!data.url;
    return false;
}, {
    message: "Invalid message object: 'content' is required for text, 'url' is required for media."
});

// Main schema for creating a new campaign, now with advanced features
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  instanceId: z.string().uuid('Invalid instance ID format.'),
  messages: z.array(messageObjectSchema).min(1, 'At least one message is required.'),
  numbers: z.array(z.string().min(1)).min(1, 'At least one phone number is required.'),
  usePlaceholders: z.boolean(),
  delaySpeed: z.enum(['fast', 'medium', 'slow', 'safe']),
  delayFromSeconds: z.number().int().min(0, "From delay must be 0 or greater."),
  delayToSeconds: z.number().int().min(1, "To delay must be 1 or greater."),
  sendingMode: z.enum(['internal', 'n8n']),
}).refine(data => data.delayToSeconds >= data.delayFromSeconds, {
    message: "'To' delay must be greater than or equal to 'From' delay.",
    path: ["delayToSeconds"], // This helps the frontend highlight the correct field
});

// Validation schema for controlling a campaign (start, pause, stop)
const controlCampaignSchema = z.object({
  action: z.enum(['start', 'pause', 'stop']),
});

/**
 * Get all campaigns for the logged-in user.
 */
export const getCampaigns = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.id;
  try {
    const sql = `SELECT c.id, c.name, c.status, c.created_at, i.display_name as instance_name,
                 (SELECT COUNT(*) FROM campaign_recipients cr WHERE cr.campaign_id = c.id) as total_recipients,
                 (SELECT COUNT(*) FROM campaign_recipients cr WHERE cr.campaign_id = c.id AND cr.status = 'sent') as sent_recipients
                 FROM campaigns c
                 JOIN instances i ON c.instance_id = i.id
                 WHERE c.owner_id = $1 ORDER BY c.created_at DESC`;
    const { rows } = await query(sql, [ownerId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[campaignController]: Error getting campaigns', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get detailed information for a single campaign.
 */
export const getCampaignDetails = async (req: AuthenticatedRequest, res: Response) => {
    const ownerId = req.user!.id;
    const { id } = req.params;
    try {
        const campaignSql = `SELECT c.*, i.display_name as instance_name 
                             FROM campaigns c
                             JOIN instances i ON c.instance_id = i.id
                             WHERE c.id = $1 AND c.owner_id = $2`;
        const campaignResult = await query(campaignSql, [id, ownerId]);
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found or you do not have permission to view it.' });
        }
        
        // TODO: Add pagination for recipients in a future step if lists are long
        const recipientsSql = `SELECT id, phone_number, status, log_message, sent_at 
                               FROM campaign_recipients 
                               WHERE campaign_id = $1 ORDER BY id ASC`;
        const recipientsResult = await query(recipientsSql, [id]);

        res.status(200).json({
            campaign: campaignResult.rows[0],
            recipients: recipientsResult.rows,
        });

    } catch (error) {
        console.error('[campaignController]: Error getting campaign details', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new campaign.
 */
export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.id;

  const validationResult = createCampaignSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: 'Invalid campaign data.', errors: validationResult.error.flatten() });
  }

  const { name, instanceId, messages, numbers, usePlaceholders, delaySpeed, delayFromSeconds, delayToSeconds, sendingMode } = validationResult.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify user owns the instance
    const instanceResult = await client.query('SELECT id FROM instances WHERE id = $1 AND owner_id = $2', [instanceId, ownerId]);
    if (instanceResult.rows.length === 0) {
      throw new Error('Instance not found or not owned by user');
    }

    const campaignSql = `INSERT INTO campaigns 
                         (owner_id, instance_id, name, message_content, use_placeholders, delay_speed, delay_from_seconds, delay_to_seconds, sending_mode)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
    const campaignResult = await client.query(campaignSql, [
        ownerId, instanceId, name, JSON.stringify(messages), usePlaceholders, delaySpeed, delayFromSeconds, delayToSeconds, sendingMode
    ]);
    const newCampaignId = campaignResult.rows[0].id;

    // Insert all recipients
    const recipientSql = 'INSERT INTO campaign_recipients (campaign_id, phone_number) VALUES ' + 
                         numbers.map((_, i) => `($1, $${i + 2})`).join(', ');
    await client.query(recipientSql, [newCampaignId, ...numbers]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Campaign created successfully as draft.', campaignId: newCampaignId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[campaignController]: Error creating campaign', error);

    if (error instanceof Error && error.message.includes('Instance not found')) {
      return res.status(403).json({ message: 'You do not own the selected instance.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Delete a campaign.
 */
export const deleteCampaign = async (req: AuthenticatedRequest, res: Response) => {
    const ownerId = req.user!.id;
    const { id } = req.params;
    try {
        const deleteResult = await query(
            "DELETE FROM campaigns WHERE id = $1 AND owner_id = $2 AND status IN ('draft', 'completed', 'stopped', 'failed')",
            [id, ownerId]
        );
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Campaign not found, not owned by you, or is currently active and cannot be deleted.' });
        }
        res.status(200).json({ message: 'Campaign deleted successfully.' });
    } catch (error) {
        console.error('[campaignController]: Error deleting campaign', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Start, Pause, or Stop a campaign.
 */
export const controlCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.id;
  const { id } = req.params;

  const validationResult = controlCampaignSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: 'Invalid action', errors: validationResult.error.flatten() });
  }
  const { action } = validationResult.data;

  // We need to fetch the instance name for the campaign service
  const campaignRes = await query(
    `SELECT c.*, i.system_name as instance_name 
     FROM campaigns c
     JOIN instances i ON c.instance_id = i.id
     WHERE c.id = $1 AND c.owner_id = $2`, 
    [id, ownerId]
  );
  if (campaignRes.rows.length === 0) {
      return res.status(404).json({ message: 'Campaign not found or you do not have permission to control it.' });
  }
  const campaign = campaignRes.rows[0];

  try {
    switch (action) {
      case 'start':
        if (campaign.status !== 'draft' && campaign.status !== 'paused' && campaign.status !== 'stopped') {
          return res.status(400).json({ message: `Campaign in '${campaign.status}' state cannot be started.` });
        }
        const runningCheck = await query("SELECT id FROM campaigns WHERE instance_id = $1 AND status = 'running'", [campaign.instance_id]);
        if (runningCheck.rows.length > 0) {
          return res.status(409).json({ message: 'This instance is already running another campaign. Please wait for it to complete.' });
        }
        
        await query("UPDATE campaigns SET status = 'running' WHERE id = $1", [id]);
        
        // --- THIS IS THE CHANGE: Trigger the background service ---
        // We call the function but don't wait for it to finish (fire-and-forget)
        startCampaignProcessing(campaign);
        // --- END OF CHANGE ---
        
        return res.status(202).json({ message: 'Campaign accepted for processing.' });

      case 'pause':
        if (campaign.status !== 'running') {
          return res.status(400).json({ message: `Campaign in '${campaign.status}' state cannot be paused.` });
        }
        await query("UPDATE campaigns SET status = 'paused' WHERE id = $1", [id]);
        return res.status(200).json({ message: 'Campaign paused.' });

      case 'stop':
        if (campaign.status !== 'running' && campaign.status !== 'paused') {
          return res.status(400).json({ message: `Campaign in '${campaign.status}' state cannot be stopped.` });
        }
        await query("UPDATE campaigns SET status = 'stopped' WHERE id = $1", [id]);
        return res.status(200).json({ message: 'Campaign stopped.' });
    }
  } catch (error) {
    console.error(`[campaignController]: Error during campaign action '${action}'`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
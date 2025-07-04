import { query } from '../db';
import { emitToUser } from './socketService';
import { checkWhatsappNumbers, sendMediaMessage, sendTextMessage } from '../api/evolutionApi';

// A simple utility to create a random delay within a given range.
const randomDelay = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000; // Convert to milliseconds
};

// A utility to pause execution.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The main campaign processing function. This runs in the background.
 * @param campaign - The full campaign object from the database.
 */
export const startCampaignProcessing = async (campaign: any) => {
    console.log(`[CampaignService] Starting processing for campaign: ${campaign.id}`);

    try {
        // --- 1. Pre-flight Check (unchanged) ---
        const recipientsResult = await query('SELECT id, phone_number FROM campaign_recipients WHERE campaign_id = $1 AND status = $2', [campaign.id, 'pending']);
        const pendingRecipients = recipientsResult.rows;
        
        if (pendingRecipients.length === 0) {
            await query("UPDATE campaigns SET status = 'completed' WHERE id = $1", [campaign.id]);
            console.log(`[CampaignService] No pending recipients found for campaign ${campaign.id}. Marking as complete.`);
            emitToUser(campaign.owner_id, 'campaign_update', { campaignId: campaign.id, status: 'completed' });
            return;
        }

        const numbersToCheck = pendingRecipients.map(r => r.phone_number);
        const validNumbersInfo = await checkWhatsappNumbers(campaign.instance_name, numbersToCheck);
        
        const validNumbersMap = new Map(validNumbersInfo.filter(n => n.exists).map(n => [n.number, n]));
        const invalidNumbers = numbersToCheck.filter(n => !validNumbersMap.has(n));

        if (invalidNumbers.length > 0) {
            const updateInvalidSql = `UPDATE campaign_recipients SET status = 'failed', log_message = 'Not a valid WhatsApp number' 
                                      WHERE campaign_id = $1 AND phone_number = ANY($2::text[])`;
            await query(updateInvalidSql, [campaign.id, invalidNumbers]);
            emitToUser(campaign.owner_id, 'campaign_progress', { campaignId: campaign.id, updatedRecipients: invalidNumbers.map(n => ({number: n, status: 'failed'})) });
        }

        const recipientsToSend = pendingRecipients.filter(r => validNumbersMap.has(r.phone_number));

        // --- THIS IS THE FIX: Define the delay map ---
        const typingDelayMap = {
            fast: 7,    // 7ms per character
            medium: 15, // 15ms per character
            slow: 25,   // 25ms per character
            safe: 40,   // 40ms per character (very human-like)
        };
        const msPerChar = typingDelayMap[campaign.delay_speed as keyof typeof typingDelayMap] || 15; // Default to medium
        // --- END OF FIX ---

        // --- 2. Main Sending Loop ---
        for (const recipient of recipientsToSend) {
            const currentCampaignState = await query('SELECT status FROM campaigns WHERE id = $1', [campaign.id]);
            if (currentCampaignState.rows[0].status === 'paused' || currentCampaignState.rows[0].status === 'stopped') {
                console.log(`[CampaignService] Campaign ${campaign.id} is ${currentCampaignState.rows[0].status}. Halting processing.`);
                return;
            }

            const contactInfo = validNumbersMap.get(recipient.phone_number);
            let logMessage = 'Sent successfully.';

            try {
                // --- 3. Inner Loop: Send all message parts sequentially ---
                for (const messagePart of campaign.message_content) {
                    let finalContent = messagePart.content || messagePart.caption || '';
                    if (campaign.use_placeholders && contactInfo?.name) {
                        finalContent = finalContent.replace(/{{name}}/gi, contactInfo.name);
                    }

                    if (messagePart.type === 'text') {
                        // --- THIS IS THE FIX: Use the mapped value ---
                        const typingDelay = finalContent.length * msPerChar;
                        await sendTextMessage(campaign.instance_name, recipient.phone_number, finalContent, typingDelay);
                    } else if (messagePart.type === 'image' || messagePart.type === 'audio') {
                        await sendMediaMessage(campaign.instance_name, recipient.phone_number, messagePart.type, messagePart.url, finalContent);
                    }
                    await sleep(1500);
                }
                await query("UPDATE campaign_recipients SET status = 'sent', log_message = $1, sent_at = NOW() WHERE id = $2", [logMessage, recipient.id]);

            } catch (err: any) {
                logMessage = err.response?.data?.message || 'Failed to send message.';
                await query("UPDATE campaign_recipients SET status = 'failed', log_message = $1 WHERE id = $2", [logMessage, recipient.id]);
            }

            emitToUser(campaign.owner_id, 'campaign_progress', { campaignId: campaign.id, updatedRecipients: [{id: recipient.id, status: 'sent', log: logMessage}] });
            
            const delay = randomDelay(campaign.delay_from_seconds, campaign.delay_to_seconds);
            await sleep(delay);
        }

        // --- 5. Finalize Campaign (unchanged) ---
        await query("UPDATE campaigns SET status = 'completed' WHERE id = $1", [campaign.id]);
        emitToUser(campaign.owner_id, 'campaign_update', { campaignId: campaign.id, status: 'completed' });
        console.log(`[CampaignService] Finished processing campaign: ${campaign.id}`);

    } catch (error) {
        console.error(`[CampaignService] CRITICAL ERROR processing campaign ${campaign.id}:`, error);
        await query("UPDATE campaigns SET status = 'failed' WHERE id = $1", [campaign.id]);
        emitToUser(campaign.owner_id, 'campaign_update', { campaignId: campaign.id, status: 'failed' });
    }
};
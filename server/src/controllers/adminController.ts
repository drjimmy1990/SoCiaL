import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '../models/User';
import pool, { query } from '../db';
import { setInstanceWebhook } from '../api/evolutionApi';
// Schema for validating the request body when updating user permissions
const updatePermissionsSchema = z.object({
  toolIds: z.array(z.number().int().positive()),
});

export const createUser = async (req: Request, res: Response) => {
  const { username, password, role, instanceLimit } = req.body;

  // --- Basic Validation ---
  if (!username || !password || !role) {
    res.status(400).json({ message: 'Username, password, and role are required.' });
    return;
  }
  
  if (role !== 'admin' && role !== 'user') {
    res.status(400).json({ message: 'Role must be either "admin" or "user".' });
    return;
  }

  try {
    // --- Check if user already exists in the database ---
    const checkUserQuery = 'SELECT username FROM users WHERE username = $1';
    const existingUser = await query(checkUserQuery, [username]);

    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: 'Username already exists.' });
      return;
    }

    // --- Hash the password ---
    const passwordHash = await bcrypt.hash(password, 10);

    // --- Insert the new user into the database ---
    const insertUserQuery = `
      INSERT INTO users (username, password_hash, role, instance_limit)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, role, instance_limit, created_at
    `;
    const newUserResult = await query(insertUserQuery, [
      username,
      passwordHash,
      role as UserRole,
      Number(instanceLimit) || 1
    ]);
    
    const newUser = newUserResult.rows[0];

    console.log('[server]: Admin created a new user in the database:', newUser);

    // --- Respond with the created user's data ---
    res.status(201).json(newUser);

  } catch (error) {
    console.error('[adminController]: Database error during user creation.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Controller to fetch all users.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT id, username, role, instance_limit, created_at 
      FROM users 
      ORDER BY username ASC
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[adminController]: Error fetching all users.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Controller to get the permitted tools for a specific user.
 */
export const getUserPermissions = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const sql = `
      SELECT t.id, t.name
      FROM tools t
      JOIN user_tool_permissions utp ON t.id = utp.tool_id
      WHERE utp.user_id = $1;
    `;
    const { rows } = await query(sql, [userId]);
    // Return just an array of tool IDs for simplicity
    const toolIds = rows.map(row => row.id);
    res.status(200).json(toolIds);
  } catch (error) {
    console.error(`[adminController]: Error fetching permissions for user ${userId}.`, error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Controller to update the permitted tools for a specific user.
 * This is a full replacement, not a partial update.
 */
export const updateUserPermissions = async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Validate the request body using Zod
  const validationResult = updatePermissionsSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: 'Invalid request body.', errors: validationResult.error.flatten() });
  }
  const { toolIds } = validationResult.data;

  // Use a transaction to ensure atomicity
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1: Delete all existing permissions for the user
    const deleteSql = 'DELETE FROM user_tool_permissions WHERE user_id = $1';
    await client.query(deleteSql, [userId]);

    // Step 2: Insert the new permissions
    if (toolIds.length > 0) {
      const insertSql = 'INSERT INTO user_tool_permissions (user_id, tool_id) VALUES ' + 
        toolIds.map((_, index) => `($1, $${index + 2})`).join(', ');
      
      await client.query(insertSql, [userId, ...toolIds]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'User permissions updated successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[adminController]: Error updating permissions for user ${userId}.`, error);
    res.status(500).json({ message: 'Internal server error while updating permissions.' });
  } finally {
    client.release();
  }
};


export const getAllSystemInstances = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        i.id, 
        i.display_name, 
        i.system_name, 
        i.status, 
        i.webhook_url,
        u.username as owner_username
      FROM instances i
      JOIN users u ON i.owner_id = u.id
      ORDER BY u.username, i.created_at DESC;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[adminController]: Error fetching all system instances.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};





// --- NEW VALIDATION SCHEMA ---
const updateInstanceConfigSchema = z.object({
    webhookUrl: z.string().url().optional(),
    campaignSendingMode: z.enum(['internal', 'n8n']).optional(),
});


// --- NEW FUNCTION ---
/**
 * Controller for an admin to update settings for any instance.
 */
export const updateInstanceConfig = async (req: Request, res: Response) => {
    const { instanceId } = req.params;

    const validationResult = updateInstanceConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid data provided.", errors: validationResult.error.flatten() });
    }
    const { webhookUrl, campaignSendingMode } = validationResult.data;

    if (!webhookUrl && !campaignSendingMode) {
        return res.status(400).json({ message: "At least one configuration setting must be provided." });
    }

    try {
        // First, get the instance's system_name from our DB
        const instanceRes = await query('SELECT system_name FROM instances WHERE id = $1', [instanceId]);
        if (instanceRes.rows.length === 0) {
            return res.status(404).json({ message: "Instance not found." });
        }
        const { system_name } = instanceRes.rows[0];

        // If a webhook URL is provided, update it on the Evolution API first
        if (webhookUrl) {
            await setInstanceWebhook(system_name, webhookUrl);
        }

        // Now, update our local database with all provided settings
        // This is a dynamic query builder
        const updates: string[] = [];
        const values: (string | null)[] = [];
        let queryIndex = 1;

        if (webhookUrl) {
            updates.push(`webhook_url = $${queryIndex++}`);
            values.push(webhookUrl);
        }
        // Note: The database schema does not currently have a campaign_sending_mode column on the instances table.
        // As per our last approved plan, this setting lives on the `campaigns` table.
        // I will omit this part of the DB update to prevent an error.
        // If we want to add a *default* mode to the instance, we must alter the table first.

        if (updates.length > 0) {
            values.push(instanceId);
            const updateSql = `UPDATE instances SET ${updates.join(', ')} WHERE id = $${queryIndex}`;
            await query(updateSql, values);
        }

        res.status(200).json({ message: "Instance configuration updated successfully." });

    } catch (error) {
        console.error(`[adminController]: Error updating config for instance ${instanceId}.`, error);
        res.status(500).json({ message: 'Failed to update instance configuration.' });
    }
};


// --- NEW FUNCTION ---
/**
 * Controller for an admin to delete a user account.
 * Note: Our schema's ON DELETE CASCADE rules will handle deleting related data.
 */
export const deleteUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const adminUserId = (req as any).user.id; // The ID of the admin performing the action

    // A critical safety check to prevent an admin from deleting their own account
    if (userId === adminUserId) {
        return res.status(403).json({ message: "Administrators cannot delete their own account." });
    }

    try {
        const deleteResult = await query('DELETE FROM users WHERE id = $1', [userId]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "User deleted successfully." });

    } catch (error) {
        console.error(`[adminController]: Error deleting user ${userId}.`, error);
        res.status(500).json({ message: 'Failed to delete user.' });
    }
};



const updateUserPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long."),
});


// --- NEW FUNCTION ---
/**
 * Controller for an admin to update a user's password.
 */
export const updateUserPassword = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const validationResult = updateUserPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid data provided.", errors: validationResult.error.flatten() });
    }
    const { password } = validationResult.data;

    try {
        // Hash the new password
        const passwordHash = await bcrypt.hash(password, 10);

        const updateResult = await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, userId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "User password updated successfully." });

    } catch (error) {
        console.error(`[adminController]: Error updating password for user ${userId}.`, error);
        res.status(500).json({ message: 'Failed to update user password.' });
    }
};


// --- NEW VALIDATION SCHEMA ---
const updateUserInstanceLimitSchema = z.object({
    instanceLimit: z.number().int().min(0, "Instance limit must be a non-negative number."),
});


// --- NEW FUNCTION ---
/**
 * Controller for an admin to update a user's instance limit.
 */
export const updateUserInstanceLimit = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const validationResult = updateUserInstanceLimitSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid data provided.", errors: validationResult.error.flatten() });
    }
    const { instanceLimit } = validationResult.data;

    try {
        const updateResult = await query(
            'UPDATE users SET instance_limit = $1 WHERE id = $2',
            [instanceLimit, userId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "User instance limit updated successfully." });

    } catch (error) {
        console.error(`[adminController]: Error updating instance limit for user ${userId}.`, error);
        res.status(500).json({ message: 'Failed to update user instance limit.' });
    }
};
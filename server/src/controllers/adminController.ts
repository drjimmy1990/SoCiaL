import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '../models/User';
import pool, { query } from '../db';

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
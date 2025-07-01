import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../models/User';
import { query } from '../db'; // Import our database query function

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
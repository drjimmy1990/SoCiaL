import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { query } from '../db'; // <-- Import our new database query function

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  try {
    // --- Find the user in the database ---
    const sqlQuery = 'SELECT * FROM users WHERE username = $1';
    const result = await query(sqlQuery, [username]);

    if (result.rows.length === 0) {
      // User not found
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const user = result.rows[0];

    // --- Compare the provided password with the stored hash ---
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    // --- User is authenticated, create a JWT ---
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '1d' } // Token will be valid for 1 day
    );

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('[authController]: Database error during login.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
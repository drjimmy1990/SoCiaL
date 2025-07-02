
import { Request, Response } from 'express';
import { query } from '../db';

/**
 * Controller to fetch all available tools from the database.
 * This is intended for public or semi-public consumption by the frontend
 * to know what tools exist in the system.
 */
export const getAllTools = async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT id, name, description FROM tools WHERE is_enabled = true ORDER BY name ASC';
    const { rows } = await query(sql);
    
    res.status(200).json(rows);

  } catch (error) {
    console.error('[toolController]: Error fetching all tools.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
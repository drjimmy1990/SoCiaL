import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { query } from '../db';

/**
 * Controller for a logged-in user to fetch their own permitted tools.
 * The frontend will use this to dynamically build the user's dashboard.
 */
export const getMyPermittedTools = async (req: AuthenticatedRequest, res: Response) => {
  const loggedInUser = req.user;

  // This check is technically redundant if authMiddleware is used, but it's good practice
  if (!loggedInUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const sql = `
      SELECT t.id, t.name, t.description
      FROM tools t
      JOIN user_tool_permissions utp ON t.id = utp.tool_id
      WHERE utp.user_id = $1 AND t.is_enabled = true
      ORDER BY t.name ASC;
    `;
    const { rows } = await query(sql, [loggedInUser.id]);
    
    res.status(200).json(rows);

  } catch (error) {
    console.error(`[permissionController]: Error fetching permissions for user ${loggedInUser.id}.`, error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
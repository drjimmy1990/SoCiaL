import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware'; // We reuse our custom request type

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // We expect authMiddleware to have run before this,
  // so the req.user object should be populated.
  if (!req.user) {
    // FIX: Removed 'return' keyword
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  // Check if the user's role is 'admin'
  if (req.user.role !== 'admin') {
    // FIX: Removed 'return' keyword
    res.status(403).json({ message: 'Forbidden: Admins only.' });
    return;
  }

  // If the user is an admin, proceed to the next handler
  next();
};
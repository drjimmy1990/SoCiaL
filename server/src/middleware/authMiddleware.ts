import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '../models/User';

// To make TypeScript happy, we need to add our custom 'user' property to the Express Request type.
// We are creating a custom interface that extends the default Request.
export interface AuthenticatedRequest extends Request {
  user?: User; // The user property will be populated from the JWT payload
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Get token from the Authorization header, which is expected to be in the format "Bearer TOKEN"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // FIX: Removed 'return' keyword
    res.status(401).json({ message: 'Authentication token required.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // The decoded payload will contain the user information we stored during login.
    // We attach it to the request object so subsequent handlers can access it.
    req.user = decoded as User;

    next(); // Token is valid, proceed to the next middleware or route handler
  } catch (error) {
    // FIX: Removed 'return' keyword
    res.status(403).json({ message: 'Invalid or expired token.' });
    return;
  }
};
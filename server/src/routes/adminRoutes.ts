
import { Router, Request, Response, NextFunction } from 'express';
import { 
  createUser,
  getAllUsers,
  getUserPermissions,
  updateUserPermissions
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Define a type for our route handlers for clarity
type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void;

// Apply auth and admin middleware to all routes in this file.
router.use(authMiddleware as RouteHandler, adminMiddleware as RouteHandler);

// --- User management routes ---
router.post('/users', createUser as RouteHandler);
router.get('/users', getAllUsers as RouteHandler);

// --- User permission management routes ---
router.get('/users/:userId/permissions', getUserPermissions as RouteHandler);
router.post('/users/:userId/permissions', updateUserPermissions as RouteHandler);

export default router;
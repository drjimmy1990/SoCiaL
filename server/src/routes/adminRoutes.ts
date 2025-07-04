import { Router, Request, Response, NextFunction } from 'express';
import { 
  createUser,
  getAllUsers,
  getUserPermissions,
  updateUserPermissions,
  getAllSystemInstances,
  updateInstanceConfig // <-- Import the new controller function
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void;

// Apply auth and admin middleware to all routes in this file.
router.use(authMiddleware as RouteHandler, adminMiddleware as RouteHandler);

// --- User management routes ---
router.post('/users', createUser as RouteHandler);
router.get('/users', getAllUsers as RouteHandler);

// --- User permission management routes ---
router.get('/users/:userId/permissions', getUserPermissions as RouteHandler);
router.post('/users/:userId/permissions', updateUserPermissions as RouteHandler);

// --- NEW: Instance management route ---
router.get('/instances', getAllSystemInstances as RouteHandler);

router.post('/instances/:instanceId/config', updateInstanceConfig as RouteHandler);




export default router;
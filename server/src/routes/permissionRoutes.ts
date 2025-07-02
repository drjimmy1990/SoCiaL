
import { Router, Request, Response, NextFunction } from 'express';
import { getMyPermittedTools } from '../controllers/permissionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Define the type alias again to solve the type inference issue.
type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void;

// This route allows a logged-in user to fetch the list of tools they are permitted to use.
// It is protected by authMiddleware to ensure only authenticated users can access it.
router.get(
  '/my-permissions', 
  authMiddleware as RouteHandler, 
  getMyPermittedTools as RouteHandler
);

export default router;

import { Router } from 'express';
import { getAllTools } from '../controllers/toolController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// This route allows any authenticated user to see the list of all available tools.
// The frontend will use this to display tool information.
// We protect it with authMiddleware to prevent unauthenticated enumeration of our platform's features.
router.get('/', authMiddleware, getAllTools);

export default router;
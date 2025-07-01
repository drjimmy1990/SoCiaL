import { Router } from 'express';
import { createUser } from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Define the route for creating a new user.
// This route is protected by two middleware functions.
// 1. authMiddleware: Checks if the user is logged in.
// 2. adminMiddleware: Checks if the logged-in user has the 'admin' role.
// Only if both checks pass, the request will be handled by createUser.
router.post('/users', authMiddleware, adminMiddleware, createUser);

export default router;
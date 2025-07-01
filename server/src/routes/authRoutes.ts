import { Router } from 'express';
import { login } from '../controllers/authController';

// Create a new router instance
const router = Router();

// Define the route for user login.
// When a POST request is made to '/api/auth/login', the 'login' controller function will handle it.
router.post('/login', login);

export default router;
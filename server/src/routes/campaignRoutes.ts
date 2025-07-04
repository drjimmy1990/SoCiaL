import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getCampaigns,
  getCampaignDetails,
  createCampaign,
  deleteCampaign,
  controlCampaign
} from '../controllers/campaignController';

const router = Router();

// Define a type for our route handlers for clarity and to prevent type errors.
type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void;

// Apply authentication middleware to all campaign routes.
router.use(authMiddleware as RouteHandler);

// --- Campaign Routes ---

// GET /api/campaigns - Get all campaigns for the user
router.get('/', getCampaigns as RouteHandler);

// POST /api/campaigns - Create a new campaign
router.post('/', createCampaign as RouteHandler);

// GET /api/campaigns/:id - Get details for a specific campaign
router.get('/:id', getCampaignDetails as RouteHandler);

// DELETE /api/campaigns/:id - Delete a specific campaign
router.delete('/:id', deleteCampaign as RouteHandler);

// POST /api/campaigns/:id/control - Start, pause, or stop a campaign
router.post('/:id/control', controlCampaign as RouteHandler);


export default router;
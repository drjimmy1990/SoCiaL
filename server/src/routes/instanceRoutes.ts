import { Router } from 'express';
import { 
  createInstanceController,
  deleteInstanceController,
  getConnectionStateController,
  connectInstanceController,
  getInstancesController,
  syncInstancesController
} from '../controllers/instanceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/sync', authMiddleware, syncInstancesController);
router.get('/', authMiddleware, getInstancesController);
router.post('/', authMiddleware, createInstanceController);
router.get('/:instanceId/status', authMiddleware, getConnectionStateController);
router.get('/:instanceId/connect', authMiddleware, connectInstanceController);
router.delete('/:instanceId', authMiddleware, deleteInstanceController);

export default router;
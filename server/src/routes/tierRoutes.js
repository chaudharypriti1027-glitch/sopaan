import { Router } from 'express';
import * as tierController from '../controllers/tierController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/status', asyncHandler(tierController.getTierStatus));

export default router;

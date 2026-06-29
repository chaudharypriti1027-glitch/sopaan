import { Router } from 'express';
import * as liveController from '../controllers/liveController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/:classId/token', requireAuth, asyncHandler(liveController.getLiveToken));

export default router;

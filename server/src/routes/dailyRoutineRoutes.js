import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as dailyRoutineController from '../controllers/dailyRoutineController.js';

const router = Router();

router.use(requireAuth);
router.get('/today', asyncHandler(dailyRoutineController.getTodayRoutine));

export default router;

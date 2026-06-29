import { Router } from 'express';
import * as wellnessController from '../controllers/wellnessController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/sessions', asyncHandler(wellnessController.listSessions));

export default router;

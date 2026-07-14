import { Router } from 'express';
import * as examPlanController from '../controllers/examPlanController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(examPlanController.getExamPlan));

export default router;

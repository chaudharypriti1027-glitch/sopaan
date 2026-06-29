import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkQuota } from '../middleware/requirePro.js';
import { validate } from '../middleware/validate.js';
import { analyticsProgressQuerySchema } from '../validators/testValidators.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/progress',
  checkQuota('detailed_analytics'),
  validate(analyticsProgressQuerySchema, 'query'),
  asyncHandler(analyticsController.getProgress),
);

export default router;

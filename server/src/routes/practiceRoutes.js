import { Router } from 'express';
import * as adaptiveController from '../controllers/adaptiveController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  adaptivePracticeSchema,
  adaptiveQuestionsSchema,
} from '../validators/adaptiveValidators.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/adaptive',
  validate(adaptivePracticeSchema),
  asyncHandler(adaptiveController.createAdaptivePracticeHandler)
);

router.get(
  '/adaptive/questions',
  validate(adaptiveQuestionsSchema, 'query'),
  asyncHandler(adaptiveController.previewAdaptiveQuestionsHandler)
);

export default router;

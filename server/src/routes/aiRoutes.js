import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkQuota } from '../middleware/requirePro.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  generateTestRequestSchema,
  askDoubtSchema,
  listDoubtHistoryQuerySchema,
  evaluateAnswerSchema,
  reportAiFeedbackSchema,
  practiceSuggestionsRequestSchema,
} from '../validators/aiValidators.js';

const router = Router();

router.use(requireAuth);
router.use(aiRateLimiter);

router.post(
  '/generate-test',
  checkQuota('ai_generate_test'),
  validate(generateTestRequestSchema),
  asyncHandler(aiController.generateTestHandler),
);
router.post(
  '/practice-suggestions',
  validate(practiceSuggestionsRequestSchema),
  asyncHandler(aiController.practiceSuggestionsHandler),
);
router.post(
  '/ask',
  checkQuota('ai_doubt'),
  validate(askDoubtSchema),
  asyncHandler(aiController.askDoubtHandler),
);
router.get(
  '/doubts',
  validate(listDoubtHistoryQuerySchema, 'query'),
  asyncHandler(aiController.listDoubtHistoryHandler),
);
router.post(
  '/evaluate-answer',
  checkQuota('ai_evaluate'),
  validate(evaluateAnswerSchema),
  asyncHandler(aiController.evaluateAnswerHandler),
);
router.post(
  '/report',
  validate(reportAiFeedbackSchema),
  asyncHandler(aiController.reportAiFeedbackHandler),
);

export default router;

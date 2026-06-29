import { Router } from 'express';
import * as questionController from '../controllers/questionController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { relatedQuestionsQuerySchema } from '../validators/questionValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', asyncHandler(questionController.getQuestionHandler));
router.get(
  '/:id/related',
  validate(relatedQuestionsQuerySchema, 'query'),
  asyncHandler(questionController.getRelatedQuestionsHandler),
);

export default router;

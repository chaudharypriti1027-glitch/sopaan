import { Router } from 'express';
import * as doubtController from '../controllers/doubtController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import {
  doubtCreateSchema,
  doubtAnswerSchema,
  doubtVoteSchema,
  doubtsQuerySchema,
} from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(doubtsQuerySchema, 'query'), asyncHandler(doubtController.listDoubts));
router.post('/', validate(doubtCreateSchema), asyncHandler(doubtController.createDoubt));
router.post(
  '/:id/answer',
  validateParams(objectIdParamsSchema),
  validate(doubtAnswerSchema),
  asyncHandler(doubtController.addAnswer),
);
router.post(
  '/:id/vote',
  validateParams(objectIdParamsSchema),
  validate(doubtVoteSchema),
  asyncHandler(doubtController.voteDoubt),
);

export default router;

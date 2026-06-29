import { Router } from 'express';
import * as attemptController from '../controllers/attemptController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { requireAttemptOwner } from '../middleware/authorizeResource.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { attemptsQuerySchema } from '../validators/testValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(attemptsQuerySchema, 'query'), asyncHandler(attemptController.listAttempts));
router.get(
  '/:id',
  validateParams(objectIdParamsSchema),
  requireAttemptOwner,
  asyncHandler(attemptController.getAttempt),
);

export default router;

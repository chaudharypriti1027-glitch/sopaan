import { Router } from 'express';
import * as revisionCapsuleController from '../controllers/revisionCapsuleController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { revisionCapsulesQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get(
  '/',
  validate(revisionCapsulesQuerySchema, 'query'),
  asyncHandler(revisionCapsuleController.listRevisionCapsules)
);

export default router;

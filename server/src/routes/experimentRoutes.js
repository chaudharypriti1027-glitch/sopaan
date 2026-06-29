import { Router } from 'express';
import * as experimentController from '../controllers/experimentController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validate } from '../middleware/validate.js';
import {
  experimentEventSchema,
  experimentQuerySchema,
} from '../validators/experimentValidators.js';

const router = Router();

router.use(optionalAuth);

router.get(
  '/',
  validate(experimentQuerySchema, 'query'),
  asyncHandler(experimentController.getExperiments),
);

router.post(
  '/events',
  validate(experimentEventSchema),
  asyncHandler(experimentController.trackEvent),
);

export default router;

import { Router } from 'express';
import * as plannerController from '../controllers/plannerController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { requirePlannerSessionOwner } from '../middleware/authorizeResource.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import {
  plannerSessionsQuerySchema,
  plannerSessionSchema,
  plannerUpdateSchema,
  plannerGenerateSchema,
} from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/sessions', validate(plannerSessionsQuerySchema, 'query'), asyncHandler(plannerController.listSessions));
router.post('/sessions', validate(plannerSessionSchema), asyncHandler(plannerController.createSession));
router.put(
  '/sessions/:id',
  validateParams(objectIdParamsSchema),
  requirePlannerSessionOwner,
  validate(plannerUpdateSchema),
  asyncHandler(plannerController.updateSession),
);
router.post('/generate', validate(plannerGenerateSchema), asyncHandler(plannerController.generatePlan));

export default router;

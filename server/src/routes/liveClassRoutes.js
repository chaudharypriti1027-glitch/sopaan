import { Router } from 'express';
import * as liveClassController from '../controllers/liveClassController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';
import {
  liveClassCreateSchema,
  liveClassStatusSchema,
} from '../validators/liveClassValidators.js';

const router = Router();

router.get('/', optionalAuth, validate(paginationQuerySchema, 'query'), asyncHandler(liveClassController.getLiveClasses));
router.get(
  '/:id',
  optionalAuth,
  validateParams(objectIdParamsSchema),
  asyncHandler(liveClassController.getLiveClass),
);

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'creator'),
  validate(liveClassCreateSchema),
  asyncHandler(liveClassController.createLiveClass),
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin', 'creator'),
  validateParams(objectIdParamsSchema),
  validate(liveClassStatusSchema),
  asyncHandler(liveClassController.updateLiveClassStatus),
);

router.post(
  '/:id/viewer-token',
  requireAuth,
  validateParams(objectIdParamsSchema),
  asyncHandler(liveClassController.createViewerToken),
);

router.post(
  '/:id/reminders',
  requireAuth,
  validateParams(objectIdParamsSchema),
  asyncHandler(liveClassController.setLiveClassReminder),
);

router.delete(
  '/:id/reminders',
  requireAuth,
  validateParams(objectIdParamsSchema),
  asyncHandler(liveClassController.removeLiveClassReminder),
);

export default router;

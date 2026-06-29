import { Router } from 'express';
import * as liveClassController from '../controllers/liveClassController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';
import {
  liveClassCreateSchema,
  liveClassStatusSchema,
} from '../validators/liveClassValidators.js';

const router = Router();

router.get('/', optionalAuth, validate(paginationQuerySchema, 'query'), asyncHandler(liveClassController.getLiveClasses));
router.get('/:id', optionalAuth, asyncHandler(liveClassController.getLiveClass));

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'mentor'),
  validate(liveClassCreateSchema),
  asyncHandler(liveClassController.createLiveClass),
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin', 'mentor'),
  validate(liveClassStatusSchema),
  asyncHandler(liveClassController.updateLiveClassStatus),
);

router.post(
  '/:id/viewer-token',
  requireAuth,
  asyncHandler(liveClassController.createViewerToken),
);

router.post(
  '/:id/reminders',
  requireAuth,
  asyncHandler(liveClassController.setLiveClassReminder),
);

router.delete(
  '/:id/reminders',
  requireAuth,
  asyncHandler(liveClassController.removeLiveClassReminder),
);

export default router;

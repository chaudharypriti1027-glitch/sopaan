import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { requireNotificationOwner } from '../middleware/authorizeResource.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import {
  paginationQuerySchema,
  pushSettingsSchema,
  pushTokenSchema,
  alertPreferencesSchema,
  notificationPreferencesSchema,
} from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(notificationController.listNotifications));
router.post(
  '/:id/read',
  validateParams(objectIdParamsSchema),
  requireNotificationOwner,
  asyncHandler(notificationController.markRead),
);
router.put('/push-token', validate(pushTokenSchema), asyncHandler(notificationController.registerPushToken));
router.put('/push-settings', validate(pushSettingsSchema), asyncHandler(notificationController.updatePushSettings));
router.get('/preferences', asyncHandler(notificationController.getNotificationPreferences));
router.put(
  '/preferences',
  validate(notificationPreferencesSchema),
  asyncHandler(notificationController.updateNotificationPreferences),
);
router.get('/alert-preferences', asyncHandler(notificationController.getAlertPreferences));
router.put(
  '/alert-preferences',
  validate(alertPreferencesSchema),
  asyncHandler(notificationController.updateAlertPreferences),
);

export default router;

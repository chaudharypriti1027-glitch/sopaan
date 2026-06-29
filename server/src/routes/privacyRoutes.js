import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deletionConfirmSchema,
  deletionRequestSchema,
  updateMarketingConsentSchema,
} from '../validators/privacyValidators.js';
import * as privacyController from '../controllers/privacyController.js';

const router = Router();

router.get('/policy', asyncHandler(privacyController.getPolicy));
router.get('/inventory', asyncHandler(privacyController.getInventory));

router.get('/consent', requireAuth, asyncHandler(privacyController.getConsent));
router.patch(
  '/consent',
  requireAuth,
  validate(updateMarketingConsentSchema),
  asyncHandler(privacyController.updateMarketingConsent),
);
router.get('/export', requireAuth, asyncHandler(privacyController.exportData));
router.post(
  '/deletion/request',
  requireAuth,
  validate(deletionRequestSchema),
  asyncHandler(privacyController.requestDeletion),
);
router.post(
  '/deletion/confirm',
  requireAuth,
  validate(deletionConfirmSchema),
  asyncHandler(privacyController.confirmDeletion),
);

export default router;

import { Router } from 'express';
import * as referralController from '../controllers/referralController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  deferredReferralClickSchema,
  referralClaimSchema,
  referralCodeSchema,
} from '../validators/referralValidators.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.post(
  '/validate',
  validate(referralCodeSchema),
  asyncHandler(referralController.validateCode),
);
router.post(
  '/track-click',
  validate(deferredReferralClickSchema),
  asyncHandler(referralController.trackDeferredClick),
);

router.use(requireAuth);

router.get('/me', validate(paginationQuerySchema, 'query'), asyncHandler(referralController.getMyReferrals));
router.post('/onboarding-complete', asyncHandler(referralController.confirmOnboarding));
router.post(
  '/claim',
  validate(referralClaimSchema),
  asyncHandler(referralController.claimDeferredReferral),
);

export default router;

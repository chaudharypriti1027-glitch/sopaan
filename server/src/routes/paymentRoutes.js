import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  cancelSubscriptionSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from '../validators/paymentValidators.js';

const router = Router();

router.get('/plans', asyncHandler(paymentController.listPlans));

router.use(requireAuth);

router.get('/entitlement', asyncHandler(paymentController.getEntitlement));
router.get('/history', asyncHandler(paymentController.getEntitlement));
router.post('/restore', asyncHandler(paymentController.restorePurchases));
router.post(
  '/cancel',
  validate(cancelSubscriptionSchema),
  asyncHandler(paymentController.cancelSubscription),
);
router.post('/create-order', validate(createOrderSchema), asyncHandler(paymentController.createOrder));
router.post('/verify', validate(verifyPaymentSchema), asyncHandler(paymentController.verifyPayment));
router.post('/start-trial', asyncHandler(paymentController.startTrial));
router.post('/e2e/activate-plan', validate(createOrderSchema), asyncHandler(paymentController.e2eSandboxActivate));

export default router;

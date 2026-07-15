import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authRateLimiter, otpBurstLimiter, otpHourlyLimiter } from '../middleware/authRateLimiter.js';
import {
  signupSchema,
  loginSchema,
  setPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
  logoutSchema,
  requestOtpSchema,
  verifyOtpSchema,
  otpRequestSchema,
  otpVerifySchema,
  googleAuthSchema,
} from '../validators/authValidators.js';

const router = Router();

router.use(authRateLimiter);

router.post('/signup', validate(signupSchema), asyncHandler(authController.signup));
router.get('/team-invite/:token', asyncHandler(authController.getTeamInvite));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/google', validate(googleAuthSchema), asyncHandler(authController.googleAuth));
router.post('/set-password', requireAuth, validate(setPasswordSchema), asyncHandler(authController.setPassword));
router.post(
  '/forgot-password',
  otpBurstLimiter,
  otpHourlyLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', optionalAuth, validate(logoutSchema), asyncHandler(authController.logout));
router.post('/request-otp', otpBurstLimiter, otpHourlyLimiter, validate(requestOtpSchema), asyncHandler(authController.requestOtp));
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post('/otp/request', otpBurstLimiter, otpHourlyLimiter, validate(otpRequestSchema), asyncHandler(authController.requestOtpLegacy));
router.post('/otp/verify', validate(otpVerifySchema), asyncHandler(authController.verifyOtpLegacy));

export default router;

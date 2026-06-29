import * as referralService from '../services/referralService.js';
import { AppError } from '../utils/AppError.js';

export async function getMyReferrals(req, res) {
  const result = await referralService.getReferralDashboard(req.user._id, req.query);
  res.status(200).json(result);
}

export async function validateCode(req, res) {
  const result = await referralService.validateReferralCode(req.body.code);
  res.status(200).json(result);
}

export async function trackDeferredClick(req, res) {
  const result = await referralService.trackDeferredReferralClick(req.body);
  res.status(200).json(result);
}

export async function claimDeferredReferral(req, res) {
  const user = req.user;
  const code = await referralService.resolveDeferredReferralCode(req.body.installId);

  if (!code) {
    res.status(200).json({ applied: false, reason: 'no_deferred_code' });
    return;
  }

  if (user.referredBy) {
    res.status(200).json({ applied: false, reason: 'already_referred' });
    return;
  }

  const result = await referralService.applyReferralAtSignup(user._id, code, {
    installId: req.body.installId,
  });

  if (!result.applied) {
    throw new AppError(`Referral could not be applied: ${result.reason}`, 400, 'REFERRAL_NOT_APPLIED');
  }

  res.status(200).json(result);
}

export async function confirmOnboarding(req, res) {
  const result = await referralService.markReferralOnboardingComplete(req.user._id);
  res.status(200).json(result);
}

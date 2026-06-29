import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { verifyAndConsumeOtp } from '../otpService.js';
import { normalizeIndianPhone } from '../../utils/phone.js';
import { signDeletionToken, verifyDeletionToken } from '../../utils/jwt.js';
import { privacyConfig } from '../../config/privacyConfig.js';
import { getPrivacyPolicy, getDataInventory } from '../../content/privacyPolicy.js';
import { exportUserData } from './dataExportService.js';
import { eraseUserData } from './dataErasureService.js';
import { logout } from '../authService.js';

export function getPublicPolicy() {
  return getPrivacyPolicy();
}

export function getPublicDataInventory() {
  return getDataInventory();
}

export function buildConsentRecord({ policyVersion, aiProcessing, marketing = false }) {
  return {
    policyVersion: policyVersion ?? privacyConfig.policyVersion,
    acceptedAt: new Date(),
    aiProcessing: Boolean(aiProcessing),
    marketing: Boolean(marketing),
  };
}

export async function getUserConsentStatus(userId) {
  const user = await User.findById(userId).select('privacyConsent accountStatus');

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return {
    consent: user.privacyConsent ?? null,
    currentPolicyVersion: privacyConfig.policyVersion,
    policyUrl: privacyConfig.policyUrl,
  };
}

export async function updateMarketingConsent(userId, marketing) {
  const user = await User.findById(userId);

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  user.privacyConsent = {
    ...(user.privacyConsent?.toObject?.() ?? user.privacyConsent ?? {}),
    marketing: Boolean(marketing),
  };

  await user.save();

  return { consent: user.privacyConsent };
}

export async function exportAccountData(userId) {
  const data = await exportUserData(userId);

  if (!data) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return data;
}

async function assertDeletionCredentials(user, { password, otpCode }) {
  if (password) {
    const withHash = await User.findById(user._id).select('+passwordHash');

    if (!withHash) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const valid = await withHash.verifyPassword(password);

    if (!valid) {
      throw new AppError('Invalid password', 401, 'INVALID_CREDENTIALS');
    }

    return;
  }

  if (otpCode && user.phone) {
    try {
      await verifyAndConsumeOtp(normalizeIndianPhone(user.phone), otpCode.trim());
    } catch {
      throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
    }

    return;
  }

  throw new AppError('Password or OTP is required to request account deletion', 400, 'VALIDATION_ERROR');
}

export async function requestAccountDeletion(userId, credentials) {
  const user = await User.findById(userId);

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  await assertDeletionCredentials(user, credentials);

  const deletionToken = signDeletionToken(user._id);
  const expiresAt = new Date(Date.now() + privacyConfig.deletionTokenExpiryMin * 60 * 1000);

  return {
    deletionToken,
    expiresAt: expiresAt.toISOString(),
    confirmPhrase: privacyConfig.deletionConfirmPhrase,
    message:
      'Account deletion is permanent. Study data will be removed and your profile anonymized. Payment records may be retained for legal obligations.',
  };
}

export async function confirmAccountDeletion(userId, { deletionToken, confirmPhrase, refreshToken }) {
  if (confirmPhrase !== privacyConfig.deletionConfirmPhrase) {
    throw new AppError('Confirmation phrase does not match', 400, 'VALIDATION_ERROR');
  }

  verifyDeletionToken(deletionToken, userId);

  const result = await eraseUserData(userId);

  await logout({ refreshToken, userId });

  return {
    ...result,
    message: 'Your account has been deleted and personal data removed or anonymized.',
  };
}

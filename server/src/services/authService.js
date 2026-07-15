import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import {
  issueTokenPair,
  rotateRefresh,
  revokeRefresh,
  revokeAllSessions,
} from './tokens.js';
import { createAndSendOtp, createAndSendEmailOtp, verifyAndConsumeOtp, verifyAndConsumeEmailOtp } from './otpService.js';
import { isEmailOtpConfigured } from './email/sendOtpEmail.js';
import { normalizeIndianPhone } from '../utils/phone.js';
import { applyReferralAtSignup, ensureUserReferralCode } from './referralService.js';
import { securityConfig } from '../config/securityConfig.js';
import { logger } from '../observability/logger.js';
import { buildConsentRecord } from './privacy/privacyService.js';
import { verifyGoogleIdToken } from './googleAuthService.js';
import { assertAccountCanAuthenticate } from '../utils/accountAuthPolicy.js';
import { env } from '../config/env.js';

function toIsoOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatUser(user) {
  const id = user._id ?? user.id;

  return {
    id: String(id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isPremium: user.isPremium,
    premiumPlan: user.premiumPlan ?? null,
    premiumExpiresAt: toIsoOrNull(user.premiumExpiresAt),
    premiumTrialUsed: Boolean(user.premiumTrialUsed),
    coins: user.coins,
    streak: user.streak,
  };
}

async function issueAuthTokens(user, { familyId } = {}) {
  const userId = user._id ?? user.id;
  return issueTokenPair(userId, { role: user.role, familyId });
}

async function grantWelcomeMonthQuietly(userId) {
  try {
    const { grantWelcomeMonthForNewStudent } = await import('./premiumService.js');
    await grantWelcomeMonthForNewStudent(userId);
  } catch (err) {
    console.warn(`[premium] welcome month grant failed for ${userId}:`, err.message);
  }
}

async function issueAuthResult(user, { isNewUser }) {
  assertAccountCanAuthenticate(user);
  const tokens = await issueAuthTokens(user);
  let freshUser = user;
  if (isNewUser) {
    await grantWelcomeMonthQuietly(user._id ?? user.id);
    freshUser = (await User.findById(user._id ?? user.id)) ?? user;
  }
  const profile = freshUser.toProfile();

  return {
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    profile,
    isNewUser,
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email ?? null,
      phone: profile.phone,
      role: profile.role ?? 'student',
      isPremium: profile.isPremium ?? false,
      premiumPlan: profile.premiumPlan ?? null,
      premiumExpiresAt: profile.premiumExpiresAt ?? null,
      premiumTrialUsed: Boolean(freshUser.premiumTrialUsed),
      coins: profile.coins ?? 0,
      streak:
        profile.streak != null
          ? { count: profile.streak, lastActiveDate: null }
          : undefined,
    },
  };
}

function legacySessionFromAuthResult(result) {
  return {
    accessToken: result.token,
    refreshToken: result.refreshToken,
    user: {
      id: result.profile.id,
      name: result.profile.name,
      email: result.profile.email ?? null,
      phone: result.profile.phone,
      role: result.profile.role ?? 'student',
      isPremium: result.profile.isPremium ?? false,
      premiumPlan: result.profile.premiumPlan ?? null,
      premiumExpiresAt: result.profile.premiumExpiresAt ?? null,
      premiumTrialUsed: Boolean(result.user?.premiumTrialUsed),
      coins: result.profile.coins ?? 0,
      streak:
        result.profile.streak != null
          ? { count: result.profile.streak, lastActiveDate: null }
          : undefined,
    },
  };
}

function handleDuplicateKeyError(err) {
  if (err?.code !== 11000) {
    throw err;
  }

  const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
  throw new AppError(`${field} is already registered`, 409, 'CONFLICT');
}

async function findUserByPhoneWithPassword(phone) {
  const normalized = normalizeIndianPhone(phone);
  return User.findOne({ phone: normalized }).select('+passwordHash');
}

async function findUserByEmailWithPassword(email) {
  return User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
}

function assertAccountNotLocked(user) {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Account temporarily locked due to failed login attempts', 423, 'ACCOUNT_LOCKED');
  }
}

async function recordFailedLogin(user) {
  user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;

  if (user.failedLoginAttempts >= securityConfig.maxLoginAttempts) {
    user.lockedUntil = new Date(Date.now() + securityConfig.lockoutDurationMs);
    logger.warn('account locked after failed logins', { userId: String(user._id) });
  }

  await user.save();
}

async function resetFailedLogin(user) {
  if (user.failedLoginAttempts || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
  }
}

export async function signup({
  name,
  email,
  phone,
  password,
  referralCode,
  installId,
  inviteToken,
  privacyConsent,
}) {
  const normalizedEmail = email?.toLowerCase();

  if (!privacyConsent?.aiProcessing) {
    throw new AppError('Privacy and AI processing consent is required', 400, 'VALIDATION_ERROR');
  }

  if (normalizedEmail) {
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new AppError('email is already registered', 409, 'CONFLICT');
    }
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError('phone is already registered', 409, 'CONFLICT');
    }
  }

  const user = new User({
    name,
    email: normalizedEmail,
    phone,
    privacyConsent: buildConsentRecord(privacyConsent),
  });

  await user.setPassword(password);

  try {
    await user.save();
  } catch (err) {
    handleDuplicateKeyError(err);
  }

  await ensureUserReferralCode(user._id);
  await applyReferralAtSignup(user._id, referralCode, { installId });

  if (inviteToken) {
    const { acceptTeamInviteOnSignup } = await import('./admin/teamService.js');
    const teamRole = await acceptTeamInviteOnSignup({
      inviteToken,
      userId: user._id,
      email: normalizedEmail,
    });
    if (teamRole) {
      user.role = teamRole;
    }
  }

  if (installId) {
    const { trackSignupComplete } = await import('./experimentService.js');
    trackSignupComplete({ installId, userId: user._id }).catch((err) => {
      console.warn(`[experiments] signup track failed for ${user._id}:`, err.message);
    });
  }

  return issueAuthResult(user, { isNewUser: true });
}

export async function login({ phone, email, password }) {
  let user;

  try {
    if (email) {
      user = await findUserByEmailWithPassword(email);
    } else {
      user = await findUserByPhoneWithPassword(phone);
    }
  } catch {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  assertAccountNotLocked(user);

  const isValid = await user.verifyPassword(password);

  if (!isValid) {
    await recordFailedLogin(user);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await resetFailedLogin(user);
  return issueAuthResult(user, { isNewUser: false });
}

export async function setPassword(userId, password) {
  const user = await User.findById(userId).select('+passwordHash');

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  await user.setPassword(password);
  await user.save();

  return { message: 'Password set successfully' };
}

/**
 * Request a password-reset OTP. Always returns the same shape so callers cannot
 * enumerate which emails are registered.
 */
export async function forgotPassword({ email }) {
  // Fail identically for every email when SMTP is missing in production —
  // never leak which accounts exist via EMAIL_UNAVAILABLE vs 200.
  if (env.isProduction && !isEmailOtpConfigured()) {
    throw new AppError(
      'Password reset email is not configured on the server',
      503,
      'EMAIL_UNAVAILABLE',
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.accountStatus !== 'deleted') {
    try {
      await createAndSendEmailOtp(normalizedEmail);
    } catch (err) {
      // Swallow send failures after the user lookup so response shape stays
      // identical for known vs unknown emails (no account enumeration).
      logger.error('[auth] forgot-password OTP send failed', {
        message: err?.message,
        code: err?.code,
      });
    }
  }

  return { sent: true };
}

/**
 * Verify email OTP and set a new password for an existing account (no signup).
 * Revokes all sessions, then issues a fresh AuthResult.
 */
export async function resetPassword({ email, code, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedCode = String(code).trim();

  await verifyAndConsumeEmailOtp(normalizedEmail, trimmedCode);

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  assertAccountCanAuthenticate(user);

  await user.setPassword(password);
  await user.save();
  await resetFailedLogin(user);
  await revokeAllSessions(user._id);

  return issueAuthResult(user, { isNewUser: false });
}

/**
 * Authenticated password change. Users without a password may set one by
 * omitting currentPassword; otherwise currentPassword is required.
 * Other sessions are revoked; a fresh AuthResult is returned for the current device.
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new AppError('Current password is required', 400, 'VALIDATION_ERROR');
    }

    const isValid = await user.verifyPassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
    }
  }

  await user.setPassword(newPassword);
  await user.save();
  await revokeAllSessions(user._id);

  const auth = await issueAuthResult(user, { isNewUser: false });
  return { message: 'Password updated successfully', ...auth };
}

export async function refreshAccessToken(refreshToken) {
  const { accessToken, refreshToken: nextRefreshToken, userId } = await rotateRefresh(refreshToken);

  const user = await User.findById(userId).lean();

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 401, 'UNAUTHORIZED');
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken: nextRefreshToken,
    user: formatUser(user),
  };
}

export async function logout({ refreshToken, userId } = {}) {
  if (refreshToken) {
    await revokeRefresh(refreshToken);
  }

  if (userId) {
    await revokeAllSessions(userId);
  }

  return { message: 'Logged out successfully' };
}

export async function requestOtp({ phone, email } = {}) {
  if (phone) {
    const normalized = normalizeIndianPhone(phone);
    await createAndSendOtp(normalized);
    return { sent: true, channel: 'phone' };
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  await createAndSendEmailOtp(normalizedEmail);
  return { sent: true, channel: 'email' };
}

export async function verifyOtp({ phone, email, code, referralCode, installId, privacyConsent } = {}) {
  if (phone) {
    return verifyPhoneOtp(phone, code, { referralCode, installId, privacyConsent });
  }

  return verifyEmailOtp(email, code, { referralCode, installId, privacyConsent });
}

async function verifyPhoneOtp(phone, code, { referralCode, installId, privacyConsent } = {}) {
  const normalized = normalizeIndianPhone(phone);
  const trimmedCode = String(code).trim();

  await verifyAndConsumeOtp(normalized, trimmedCode);

  let user = await User.findOne({ phone: normalized });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;

    user = new User({
      phone: normalized,
      name: 'Student',
      onboardingComplete: false,
      // Consent is optional here for backward compatibility with older clients
      // that only ever sent { phone, code }; the current mobile app always
      // collects it before requesting an OTP and passes it through.
      ...(privacyConsent?.aiProcessing ? { privacyConsent: buildConsentRecord(privacyConsent) } : {}),
    });

    try {
      await user.save();
    } catch (err) {
      if (err?.code === 11000) {
        user = await User.findOne({ phone: normalized });
        isNewUser = false;
      } else {
        handleDuplicateKeyError(err);
      }
    }

    if (isNewUser && user) {
      await ensureUserReferralCode(user._id);
      await applyReferralAtSignup(user._id, referralCode, { installId });

      if (installId) {
        const { trackSignupComplete } = await import('./experimentService.js');
        trackSignupComplete({ installId, userId: user._id }).catch((trackErr) => {
          console.warn(`[experiments] otp signup track failed for ${user._id}:`, trackErr.message);
        });
      }
    }
  }

  if (!user) {
    throw new AppError('Unable to complete sign in', 500, 'INTERNAL_ERROR');
  }

  await resetFailedLogin(user);
  return issueAuthResult(user, { isNewUser });
}

async function verifyEmailOtp(email, code, { referralCode, installId, privacyConsent } = {}) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedCode = String(code).trim();

  await verifyAndConsumeEmailOtp(normalizedEmail, trimmedCode);

  let user = await User.findOne({ email: normalizedEmail });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;

    user = new User({
      email: normalizedEmail,
      name: 'Student',
      onboardingComplete: false,
      ...(privacyConsent?.aiProcessing ? { privacyConsent: buildConsentRecord(privacyConsent) } : {}),
    });

    try {
      await user.save();
    } catch (err) {
      if (err?.code === 11000) {
        user = await User.findOne({ email: normalizedEmail });
        isNewUser = false;
      } else {
        handleDuplicateKeyError(err);
      }
    }

    if (isNewUser && user) {
      await ensureUserReferralCode(user._id);
      await applyReferralAtSignup(user._id, referralCode, { installId });

      if (installId) {
        const { trackSignupComplete } = await import('./experimentService.js');
        trackSignupComplete({ installId, userId: user._id }).catch((trackErr) => {
          console.warn(`[experiments] email otp signup track failed for ${user._id}:`, trackErr.message);
        });
      }
    }
  }

  if (!user) {
    throw new AppError('Unable to complete sign in', 500, 'INTERNAL_ERROR');
  }

  await resetFailedLogin(user);
  return issueAuthResult(user, { isNewUser });
}

export async function loginWithGoogle({
  idToken,
  referralCode,
  installId,
  privacyConsent,
}) {
  const payload = await verifyGoogleIdToken(idToken);
  const sub = payload.sub;
  const normalizedEmail = payload.email?.toLowerCase().trim();
  const emailVerified = payload.email_verified === true;
  const displayName = payload.name?.trim();
  const avatarUrl = payload.picture?.trim();

  if (!normalizedEmail || !emailVerified) {
    throw new AppError(
      'Google did not share a verified email address. Allow email access and try again.',
      400,
      'GOOGLE_EMAIL_REQUIRED',
      {
        paywallTitle: 'Email permission required',
        paywallMessage:
          'Sopaan needs your Google email to create or link your account. Sign in again and allow email access.',
      },
    );
  }

  let user = await User.findOne({ googleSub: sub });

  if (user) {
    if (user.accountStatus === 'deleted') {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    await resetFailedLogin(user);
    return issueAuthResult(user, { isNewUser: false });
  }

  user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (user.accountStatus === 'deleted') {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (user.googleSub && user.googleSub !== sub) {
      throw new AppError(
        'This email is already linked to a different Google account',
        409,
        'CONFLICT',
      );
    }

    user.googleSub = sub;

    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }

    if (displayName && (!user.name || user.name === 'Student')) {
      user.name = displayName;
    }

    await user.save();
    await resetFailedLogin(user);
    return issueAuthResult(user, { isNewUser: false });
  }

  if (!privacyConsent?.aiProcessing) {
    throw new AppError('Privacy and AI processing consent is required', 400, 'VALIDATION_ERROR');
  }

  user = new User({
    name: displayName || 'Student',
    email: normalizedEmail,
    googleSub: sub,
    avatarUrl: avatarUrl || undefined,
    onboardingComplete: false,
    privacyConsent: buildConsentRecord(privacyConsent),
  });

  try {
    await user.save();
  } catch (err) {
    handleDuplicateKeyError(err);
  }

  await ensureUserReferralCode(user._id);
  await applyReferralAtSignup(user._id, referralCode, { installId });

  if (installId) {
    const { trackSignupComplete } = await import('./experimentService.js');
    trackSignupComplete({ installId, userId: user._id }).catch((err) => {
      console.warn(`[experiments] google signup track failed for ${user._id}:`, err.message);
    });
  }

  return issueAuthResult(user, { isNewUser: true });
}

/** Map AuthResult to legacy mobile session shape. */
export function toLegacyAuthSession(result) {
  return legacySessionFromAuthResult(result);
}

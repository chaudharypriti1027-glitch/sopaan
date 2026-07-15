import crypto from 'crypto';
import { Referral } from '../models/Referral.js';
import { DeferredReferralClick } from '../models/DeferredReferralClick.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, startOfDay } from '../utils/pagination.js';
import {
  REFERRAL_APP_SCHEME,
  REFERRAL_GUARDS,
  REFERRAL_LINK_BASE,
  REFERRAL_REWARDS,
} from '../config/referralConfig.js';
import { awardCoins } from './gamificationService.js';
import { grantReferralTrialDays } from './premiumService.js';
import { createNotification } from './notificationService.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCodeSuffix(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i += 1) {
    result += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }

  return result;
}

export function normalizeReferralCode(code) {
  return code?.trim().toUpperCase().replace(/^SOPAAN[-_]?/i, 'SOPAAN-') ?? '';
}

export function buildReferralLinks(code) {
  const normalized = normalizeReferralCode(code);
  const encoded = encodeURIComponent(normalized);

  return {
    code: normalized,
    appLink: `${REFERRAL_APP_SCHEME}://refer?code=${encoded}`,
    webLink: `${REFERRAL_LINK_BASE}/${normalized.replace('SOPAAN-', '')}`,
    shareText: `Join me on Sopaan — AI prep to crack any exam. Use my code ${normalized} to get bonus coins when you complete your first mock.`,
  };
}

export async function ensureUserReferralCode(userId) {
  const user = await User.findById(userId).select('referralCode');

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (user.referralCode) {
    return normalizeReferralCode(user.referralCode);
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `SOPAAN-${randomCodeSuffix()}`;

    try {
      const updated = await User.findOneAndUpdate(
        { _id: userId, referralCode: { $in: [null, undefined, ''] } },
        { referralCode: candidate },
        { new: true },
      ).select('referralCode');

      if (updated?.referralCode) {
        return normalizeReferralCode(updated.referralCode);
      }

      const existing = await User.findById(userId).select('referralCode').lean();
      if (existing?.referralCode) {
        return normalizeReferralCode(existing.referralCode);
      }
    } catch (err) {
      if (err?.code !== 11000) {
        throw err;
      }
    }
  }

  throw new AppError('Could not generate referral code', 500, 'INTERNAL_ERROR');
}

async function findReferrerByCode(code) {
  const normalized = normalizeReferralCode(code);
  const shortCode = normalized.replace(/^SOPAAN-/, '');

  return User.findOne({
    $or: [{ referralCode: normalized }, { referralCode: `SOPAAN-${shortCode}` }, { referralCode: shortCode }],
  }).select('_id name email phone referralCode createdAt referredBy');
}

async function countReferralsToday(referrerId) {
  const today = startOfDay(new Date());
  return Referral.countDocuments({
    referrerId,
    createdAt: { $gte: today },
    status: { $ne: 'rejected' },
  });
}

async function validateReferralPair(referrer, referee, code) {
  if (!referrer) {
    return { ok: false, reason: 'invalid_code' };
  }

  if (referrer._id.toString() === referee._id.toString()) {
    return { ok: false, reason: 'self_referral' };
  }

  const referrerAgeMs = Date.now() - new Date(referrer.createdAt).getTime();
  const minAgeMs = REFERRAL_GUARDS.minReferrerAgeHours * 60 * 60 * 1000;

  if (referrerAgeMs < minAgeMs) {
    return { ok: false, reason: 'referrer_too_new' };
  }

  const signupAgeMs = Date.now() - new Date(referee.createdAt).getTime();
  const signupWindowMs = REFERRAL_GUARDS.signupWindowHours * 60 * 60 * 1000;

  if (signupAgeMs > signupWindowMs) {
    return { ok: false, reason: 'signup_window_expired' };
  }

  if (referee.referredBy && referee.referredBy.toString() !== referrer._id.toString()) {
    return { ok: false, reason: 'already_referred' };
  }

  const existingReferral = await Referral.findOne({ refereeId: referee._id }).lean();
  if (existingReferral) {
    return { ok: false, reason: 'referral_exists' };
  }

  const referralsToday = await countReferralsToday(referrer._id);
  if (referralsToday >= REFERRAL_GUARDS.dailyReferralCap) {
    return { ok: false, reason: 'referrer_daily_cap' };
  }

  const refereeEmail = referee.email?.toLowerCase();
  const refereePhone = referee.phone?.trim();
  const referrerEmail = referrer.email?.toLowerCase();
  const referrerPhone = referrer.phone?.trim();

  if (
    (refereeEmail && referrerEmail && refereeEmail === referrerEmail) ||
    (refereePhone && referrerPhone && refereePhone === referrerPhone)
  ) {
    return { ok: false, reason: 'shared_contact' };
  }

  const circular = await Referral.findOne({
    referrerId: referee._id,
    refereeId: referrer._id,
  }).lean();

  if (circular) {
    return { ok: false, reason: 'circular_referral' };
  }

  return { ok: true, code: normalizeReferralCode(code) };
}

export async function trackDeferredReferralClick({ code, installId }) {
  const normalized = normalizeReferralCode(code);
  const referrer = await findReferrerByCode(normalized);

  if (!referrer) {
    return { tracked: false, reason: 'invalid_code' };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFERRAL_GUARDS.deferredTtlDays);

  await DeferredReferralClick.findOneAndUpdate(
    { installId },
    {
      $set: {
        code: normalized,
        expiresAt,
        claimedBy: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { tracked: true, code: normalized, expiresAt };
}

export async function resolveDeferredReferralCode(installId) {
  if (!installId) {
    return null;
  }

  const click = await DeferredReferralClick.findOne({
    installId,
    claimedBy: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  return click?.code ?? null;
}

export async function applyReferralAtSignup(refereeId, code, { installId } = {}) {
  let referralCode = code?.trim() ? normalizeReferralCode(code) : null;

  if (!referralCode && installId) {
    referralCode = await resolveDeferredReferralCode(installId);
  }

  if (!referralCode) {
    return { applied: false, reason: 'no_code' };
  }

  const [referrer, referee] = await Promise.all([
    findReferrerByCode(referralCode),
    User.findById(refereeId).select('email phone referredBy createdAt'),
  ]);

  if (!referee) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const validation = await validateReferralPair(referrer, referee, referralCode);

  if (!validation.ok) {
    if (referrer) {
      await Referral.create({
        referrerId: referrer._id,
        refereeId: referee._id,
        code: validation.code ?? referralCode,
        status: 'rejected',
        rejectionReason: validation.reason,
      }).catch(() => null);
    }

    return { applied: false, reason: validation.reason };
  }

  referee.referredBy = referrer._id;
  await referee.save();

  const referral = await Referral.create({
    referrerId: referrer._id,
    refereeId: referee._id,
    code: validation.code,
    status: 'pending',
  });

  if (installId) {
    await DeferredReferralClick.findOneAndUpdate(
      { installId },
      { $set: { claimedBy: referee._id } },
    );
  }

  return {
    applied: true,
    referralId: referral._id.toString(),
    referrerName: referrer.name,
  };
}

export async function markReferralOnboardingComplete(refereeId) {
  const referral = await Referral.findOne({ refereeId, status: 'pending' });

  if (!referral) {
    return { updated: false };
  }

  referral.status = 'onboarding_complete';
  referral.onboardingCompletedAt = new Date();
  await referral.save();

  return { updated: true, referralId: referral._id.toString() };
}

async function grantReferralSideEffects(userId, reward, { title, body, data }) {
  if (reward.coins > 0) {
    await awardCoins(userId, reward.coins);
  }

  if (reward.trialDays > 0) {
    await grantReferralTrialDays(userId, reward.trialDays);
  }

  await createNotification(userId, {
    type: 'reward',
    title,
    body,
    data,
  });
}

export async function tryGrantReferralRewards(refereeId) {
  const referral = await Referral.findOne({
    refereeId,
    status: 'onboarding_complete',
  });

  if (!referral) {
    return { granted: false, reason: 'not_ready' };
  }

  referral.firstTestCompletedAt = new Date();
  referral.status = 'rewarded';
  referral.rewardedAt = new Date();
  referral.referrerReward = {
    coins: REFERRAL_REWARDS.referrerCoins,
    trialDays: REFERRAL_REWARDS.referrerTrialDays,
  };
  referral.refereeReward = {
    coins: REFERRAL_REWARDS.refereeCoins,
    trialDays: REFERRAL_REWARDS.refereeTrialDays,
  };
  await referral.save();

  const referee = await User.findById(refereeId).select('name').lean();

  await grantReferralSideEffects(
    referral.referrerId,
    referral.referrerReward,
    {
      title: 'Referral reward unlocked',
      body: `${referee?.name ?? 'Your friend'} completed onboarding and their first mock. You earned ${referral.referrerReward.coins} coins!`,
      data: { referralId: referral._id.toString(), role: 'referrer' },
    },
  );

  await grantReferralSideEffects(
    referral.refereeId,
    referral.refereeReward,
    {
      title: 'Welcome bonus unlocked',
      body: `You earned ${referral.refereeReward.coins} coins${referral.refereeReward.trialDays ? ` and ${referral.refereeReward.trialDays} bonus premium days` : ''} for joining via referral.`,
      data: { referralId: referral._id.toString(), role: 'referee' },
    },
  );

  return {
    granted: true,
    referralId: referral._id.toString(),
    referrerReward: referral.referrerReward,
    refereeReward: referral.refereeReward,
  };
}

export async function getReferralDashboard(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const code = await ensureUserReferralCode(userId);
  const links = buildReferralLinks(code);

  const [sentReferrals, totalReferrals, coinsAgg] = await Promise.all([
    Referral.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('refereeId', 'name createdAt')
      .lean(),
    Referral.countDocuments({ referrerId: userId }),
    Referral.aggregate([
      { $match: { referrerId: userId, status: 'rewarded' } },
      { $group: { _id: null, coins: { $sum: '$referrerReward.coins' } } },
    ]),
  ]);

  const stats = {
    invited: totalReferrals,
    pending: sentReferrals.filter((item) => ['pending', 'onboarding_complete'].includes(item.status)).length,
    rewarded: sentReferrals.filter((item) => item.status === 'rewarded').length,
    rejected: sentReferrals.filter((item) => item.status === 'rejected').length,
    coinsEarned: coinsAgg[0]?.coins ?? 0,
  };

  return {
    ...links,
    stats,
    referrals: sentReferrals.map((item) => ({
      id: item._id.toString(),
      status: item.status,
      code: item.code,
      refereeName: item.refereeId?.name ?? 'Student',
      refereeJoinedAt: item.refereeId?.createdAt ?? item.createdAt,
      onboardingCompletedAt: item.onboardingCompletedAt,
      firstTestCompletedAt: item.firstTestCompletedAt,
      rewardedAt: item.rewardedAt,
      referrerReward: item.referrerReward,
      refereeReward: item.refereeReward,
      rejectionReason: item.rejectionReason,
      createdAt: item.createdAt,
    })),
    pagination: {
      total: totalReferrals,
      limit,
      offset,
      hasMore: offset + sentReferrals.length < totalReferrals,
    },
    rewards: REFERRAL_REWARDS,
  };
}

export async function validateReferralCode(code) {
  const normalized = normalizeReferralCode(code);
  const referrer = await findReferrerByCode(normalized);

  if (!referrer) {
    return { valid: false, reason: 'invalid_code' };
  }

  return {
    valid: true,
    code: normalized,
    referrerName: referrer.name,
  };
}

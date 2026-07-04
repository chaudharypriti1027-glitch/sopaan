import { AppError } from '../utils/AppError.js';
import { DailyQuotaUsage } from '../models/DailyQuotaUsage.js';
import {
  TIER_FEATURES,
  getFeaturePaywallCopy,
  getTierLimits,
  listPublicTierConfig,
} from '../config/freeTierConfig.js';
import { getFreeTierLimitsFromSettings } from './platformSettingsService.js';
import { isPremiumActive } from './premiumService.js';
import { AiDailyUsage } from '../models/AiDailyUsage.js';
import { getUsageFieldForTier } from './ai/aiUsageLimits.js';

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function buildProRequiredError(featureKey) {
  const copy = getFeaturePaywallCopy(featureKey);

  return new AppError(copy.message, 403, 'PRO_REQUIRED', {
    feature: featureKey,
    paywallTitle: copy.title,
    paywallMessage: copy.message,
  });
}

function buildQuotaExceededError(featureKey, limit, usage) {
  const copy = getFeaturePaywallCopy(featureKey);

  return new AppError(
    `Daily limit reached (${usage}/${limit}). ${copy.message}`,
    429,
    'QUOTA_EXCEEDED',
    {
      feature: featureKey,
      limit,
      usage,
      paywallTitle: copy.title,
      paywallMessage: copy.message,
    },
  );
}

export async function resolveTierAccess(user) {
  const isPro = user?.role === 'admin' || (user ? await isPremiumActive(user) : false);
  return {
    isPro,
    limits: getTierLimits(isPro),
    config: listPublicTierConfig(isPro),
  };
}

async function getDailyCount(userId, featureKey, dateKey = utcDateKey()) {
  if (featureKey === 'ai_doubt') {
    const usage = await AiDailyUsage.findOne({ userId, dateKey }).lean();
    return usage?.fastCalls ?? 0;
  }

  const doc = await DailyQuotaUsage.findOne({ userId, dateKey }).lean();
  return doc?.counts?.[featureKey] ?? 0;
}

export async function getQuotaUsageSnapshot(userId, isPro) {
  const dateKey = utcDateKey();
  const limits = getTierLimits(isPro);
  const aiUsage = await AiDailyUsage.findOne({ userId, dateKey }).lean();
  const quotaDoc = await DailyQuotaUsage.findOne({ userId, dateKey }).lean();

  return {
    dateKey,
    aiGenerateTests: quotaDoc?.counts?.ai_generate_test ?? 0,
    aiEvaluations: quotaDoc?.counts?.ai_evaluate ?? 0,
    mocksSubmitted: quotaDoc?.counts?.mock_submit ?? 0,
    aiDoubtsFast: aiUsage?.fastCalls ?? 0,
    aiDoubtsQuality: aiUsage?.qualityCalls ?? 0,
    limits,
    remaining: {
      aiGenerateTests: Math.max(0, limits.aiGenerateTestsPerDay - (quotaDoc?.counts?.ai_generate_test ?? 0)),
      aiEvaluations: Math.max(0, limits.aiEvaluationsPerDay - (quotaDoc?.counts?.ai_evaluate ?? 0)),
      mocksSubmitted: Math.max(0, limits.mocksPerDay - (quotaDoc?.counts?.mock_submit ?? 0)),
      aiDoubtsFast: Math.max(0, limits.aiDoubtsFastPerDay - (aiUsage?.fastCalls ?? 0)),
      aiDoubtsQuality: Math.max(0, limits.aiDoubtsQualityPerDay - (aiUsage?.qualityCalls ?? 0)),
    },
  };
}

export async function getTierStatusForUser(user) {
  const { isPro, config } = await resolveTierAccess(user);
  const usage = user?._id ? await getQuotaUsageSnapshot(user._id, isPro) : null;

  return {
    ...config,
    usage,
  };
}

export async function assertFeatureAccess(user, featureKey) {
  const feature = TIER_FEATURES[featureKey];
  if (!feature) {
    throw new AppError('Unknown feature gate', 500, 'INVALID_FEATURE');
  }

  const { isPro, limits } = await resolveTierAccess(user);

  if (isPro) {
    return { isPro: true, feature: featureKey, unlimited: true };
  }

  if (feature.type === 'pro_only') {
    if (featureKey === 'detailed_analytics' && limits.detailedAnalytics) {
      return { isPro: false, feature: featureKey, unlimited: true };
    }
    throw buildProRequiredError(featureKey);
  }

  const limit = limits[feature.limitKey] ?? 0;
  const usage = await getDailyCount(user._id, featureKey);

  if (usage >= limit) {
    throw buildQuotaExceededError(featureKey, limit, usage);
  }

  return {
    isPro: false,
    feature: featureKey,
    limit,
    usage,
    remaining: limit - usage,
  };
}

export async function recordFeatureUsage(userId, featureKey, amount = 1) {
  if (!userId || amount <= 0) {
    return;
  }

  const dateKey = utcDateKey();

  await DailyQuotaUsage.findOneAndUpdate(
    { userId, dateKey },
    {
      $inc: { [`counts.${featureKey}`]: amount },
      $setOnInsert: { userId, dateKey },
    },
    { upsert: true, new: true },
  );
}

export async function assertAiTierAccess(user, tier = 'fast') {
  const { isPro, limits } = await resolveTierAccess(user);
  const dateKey = utcDateKey();
  const usage = await AiDailyUsage.findOne({ userId: user._id, dateKey }).lean();
  const field = getUsageFieldForTier(tier);
  const current = usage?.[field] ?? 0;
  const limit =
    tier === 'quality' ? limits.aiDoubtsQualityPerDay : limits.aiDoubtsFastPerDay;

  if (isPro || current < limit) {
    return { isPro, tier, limit, usage: current, remaining: limit - current };
  }

  throw buildQuotaExceededError('ai_doubt', limit, current);
}

/** @deprecated use getTierLimits() */
export function getFreeTierLimits() {
  return getFreeTierLimitsFromSettings();
}

/** @deprecated use PRO_REQUIRED in new clients */
export function buildPremiumRequiredError(featureKey = 'ai_evaluate') {
  const err = buildProRequiredError(featureKey);
  err.code = 'PREMIUM_REQUIRED';
  return err;
}

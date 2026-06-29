/** Daily AI call limits per tier (resets UTC midnight). Values from freeTierConfig. */
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '../../config/freeTierConfig.js';

export const DAILY_LIMITS = Object.freeze({
  free: {
    fast: FREE_TIER_LIMITS.aiDoubtsFastPerDay,
    quality: FREE_TIER_LIMITS.aiDoubtsQualityPerDay,
  },
  premium: {
    fast: PRO_TIER_LIMITS.aiDoubtsFastPerDay,
    quality: PRO_TIER_LIMITS.aiDoubtsQualityPerDay,
  },
});

export function getDailyLimits(isPremium) {
  return isPremium ? DAILY_LIMITS.premium : DAILY_LIMITS.free;
}

export function getUsageFieldForTier(tier) {
  return tier === 'fast' ? 'fastCalls' : 'qualityCalls';
}

export function isLimitReached(usage, tier, isPremium) {
  const limits = getDailyLimits(isPremium);
  const field = getUsageFieldForTier(tier);
  return (usage[field] ?? 0) >= limits[tier];
}

export function buildLimitMessage(isPremium) {
  if (isPremium) {
    return 'Daily AI limit reached. Your limits reset at midnight UTC.';
  }
  return 'Daily AI limit reached. Upgrade to Sopaan Pro for unlimited Ask AI.';
}

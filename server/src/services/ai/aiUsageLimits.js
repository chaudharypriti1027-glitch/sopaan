/** Daily AI call limits per tier (resets UTC midnight). Values from PlatformSettings. */
import { getTierLimits } from '../../config/freeTierConfig.js';

export function getDailyLimits(isPremium) {
  const limits = getTierLimits(isPremium);
  return {
    fast: limits.aiDoubtsFastPerDay,
    quality: limits.aiDoubtsQualityPerDay,
  };
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

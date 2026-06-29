import { describe, expect, it } from '@jest/globals';
import {
  buildLimitMessage,
  getDailyLimits,
  getUsageFieldForTier,
  isLimitReached,
} from '../src/services/ai/aiUsageLimits.js';

describe('aiUsageLimits', () => {
  it('maps tiers to usage fields', () => {
    expect(getUsageFieldForTier('fast')).toBe('fastCalls');
    expect(getUsageFieldForTier('quality')).toBe('qualityCalls');
  });

  it('returns higher limits for premium users', () => {
    expect(getDailyLimits(false).quality).toBeLessThan(getDailyLimits(true).quality);
    expect(getDailyLimits(false).fast).toBeLessThan(getDailyLimits(true).fast);
  });

  it('detects when a tier limit is reached', () => {
    const limits = getDailyLimits(false);

    expect(
      isLimitReached({ fastCalls: limits.fast - 1, qualityCalls: 0 }, 'fast', false),
    ).toBe(false);

    expect(
      isLimitReached({ fastCalls: limits.fast, qualityCalls: 0 }, 'fast', false),
    ).toBe(true);
  });

  it('builds upgrade messaging for free users', () => {
    expect(buildLimitMessage(false)).toMatch(/Upgrade to Sopaan Pro/i);
    expect(buildLimitMessage(true)).not.toMatch(/Upgrade/i);
  });
});

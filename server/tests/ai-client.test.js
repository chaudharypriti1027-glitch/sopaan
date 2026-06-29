import { describe, expect, it } from '@jest/globals';
import {
  buildCachedSystem,
  FEATURE_MODEL_TIER,
  MODELS,
  resolveModel,
  TIERS,
} from '../src/services/ai/claudeClient.js';

describe('claudeClient helpers', () => {
  it('routes tiers to the expected models', () => {
    expect(resolveModel({ tier: TIERS.FAST })).toBe(MODELS.FAST);
    expect(resolveModel({ tier: TIERS.QUALITY })).toBe(MODELS.QUALITY);
    expect(resolveModel({ tier: TIERS.QUALITY, model: 'custom-model' })).toBe('custom-model');
  });

  it('documents feature tier defaults for billing protection', () => {
    expect(FEATURE_MODEL_TIER.test_generation).toBe(TIERS.QUALITY);
    expect(FEATURE_MODEL_TIER.doubt_solver).toBe(TIERS.FAST);
  });

  it('marks stable system text for ephemeral caching', () => {
    const system = buildCachedSystem({ stableText: 'Stable rubric', dynamicSuffix: 'Language: English' });

    expect(Array.isArray(system)).toBe(true);
    expect(system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(system[1].cache_control).toBeUndefined();
  });

  it('returns plain text when caching is disabled with a single block', () => {
    const system = buildCachedSystem({ stableText: 'No cache', cache: false });
    expect(system).toBe('No cache');
  });
});

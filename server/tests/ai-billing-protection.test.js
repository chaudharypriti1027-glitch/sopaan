import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AiDailyUsage } from '../src/models/AiDailyUsage.js';
import { FREE_TIER_LIMITS } from '../src/config/freeTierConfig.js';
import {
  resetGlobalBudgetForTests,
  incrementGlobalTokenUsage,
  isGlobalBudgetExceeded,
} from '../src/services/ai/aiGlobalBudget.js';
import { resolveEffectiveTier, FEATURE_MODEL_TIER } from '../src/services/ai/aiModelRouting.js';
import { MODELS, TIERS, resolveModel } from '../src/services/ai/claudeClient.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';
import { utcDateKey } from '../src/services/quotaService.js';

const { default: app } = await import('../src/app.js');

describe('AI billing protection', () => {
  const originalBudget = process.env.AI_GLOBAL_DAILY_TOKEN_BUDGET;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (originalBudget === undefined) {
      delete process.env.AI_GLOBAL_DAILY_TOKEN_BUDGET;
    } else {
      process.env.AI_GLOBAL_DAILY_TOKEN_BUDGET = originalBudget;
    }
  });

  beforeEach(async () => {
    await clearTestDatabase();
    resetGlobalBudgetForTests();
    process.env.AI_GLOBAL_DAILY_TOKEN_BUDGET = '100';
  });

  describe('model routing', () => {
    it('maps reasoning features to Sonnet and cheap features to Haiku', () => {
      expect(FEATURE_MODEL_TIER.test_generation).toBe('quality');
      expect(FEATURE_MODEL_TIER.answer_evaluation).toBe('quality');
      expect(FEATURE_MODEL_TIER.attempt_coaching).toBe('quality');
      expect(FEATURE_MODEL_TIER.doubt_solver).toBe('fast');
      expect(FEATURE_MODEL_TIER.home_ai_nudges).toBe('fast');
      expect(FEATURE_MODEL_TIER.current_affairs_summary).toBe('fast');
      expect(MODELS.QUALITY).toBe('claude-sonnet-4-6');
      expect(MODELS.FAST).toBe('claude-haiku-4-5-20251001');
    });

    it('downgrades quality tier to fast when global budget is exceeded', () => {
      expect(
        resolveEffectiveTier({ tier: TIERS.QUALITY, feature: 'test_generation', budgetExceeded: true }),
      ).toBe(TIERS.FAST);

      expect(
        resolveEffectiveTier({ tier: TIERS.FAST, feature: 'doubt_solver', budgetExceeded: true }),
      ).toBe(TIERS.FAST);
    });
  });

  describe('per-user doubt quota', () => {
    it('returns QUOTA_EXCEEDED with upgrade copy when free user hits doubt cap', async () => {
      const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
        name: 'Doubt User',
        email: `doubt_${Date.now()}@test.com`,
        password: 'Password123',
      }));

      const userId = signup.body.user.id;
      const limit = FREE_TIER_LIMITS.aiDoubtsFastPerDay;

      await AiDailyUsage.findOneAndUpdate(
        { userId, dateKey: utcDateKey() },
        { $set: { fastCalls: limit } },
        { upsert: true },
      );

      const response = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${signup.body.accessToken}`)
        .send({ question: 'What is federalism?', language: 'en' });

      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('QUOTA_EXCEEDED');
      expect(response.body.error.details.feature).toBe('ai_doubt');
      expect(response.body.error.details.paywallTitle).toMatch(/doubt/i);
      expect(response.body.error.details.paywallMessage).toMatch(/Upgrade to Sopaan Pro/i);
    });
  });

  describe('global token budget circuit-breaker', () => {
    it('tracks usage and marks budget as exceeded', async () => {
      expect(await isGlobalBudgetExceeded()).toBe(false);
      await incrementGlobalTokenUsage(60);
      expect(await isGlobalBudgetExceeded()).toBe(false);
      await incrementGlobalTokenUsage(50);
      expect(await isGlobalBudgetExceeded()).toBe(true);
    });

    it('routes degraded quality features to Haiku when budget is exceeded', async () => {
      await incrementGlobalTokenUsage(150);
      expect(await isGlobalBudgetExceeded()).toBe(true);

      const tier = resolveEffectiveTier({
        tier: TIERS.QUALITY,
        feature: 'test_generation',
        budgetExceeded: await isGlobalBudgetExceeded(),
      });

      expect(tier).toBe(TIERS.FAST);
      expect(resolveModel({ tier })).toBe(MODELS.FAST);
    });
  });
});

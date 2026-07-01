import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { DailyQuotaUsage } from '../src/models/DailyQuotaUsage.js';
import {
  assertFeatureAccess,
  recordFeatureUsage,
  utcDateKey,
} from '../src/services/quotaService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { withPrivacyConsent } from './helpers/privacy.js';

const { default: app } = await import('../src/app.js');

describe('free tier quotas', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns tier status with limits and usage', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Tier User',
      email: 'tier@test.com',
      password: 'Password123!',
    }));

    const response = await request(app)
      .get('/api/tier/status')
      .set('Authorization', `Bearer ${signup.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.isPro).toBe(false);
    expect(response.body.limits.aiGenerateTestsPerDay).toBeGreaterThan(0);
    expect(response.body.features.ai_generate_test.title).toContain('AI tests');
    expect(response.body.showAds).toBe(true);
  });

  it('blocks free users after ai test quota is exhausted', async () => {
    const user = await createTestUser({
      name: 'Quota User',
      email: 'quota@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const first = await assertFeatureAccess(user, 'ai_generate_test');
    const limit = first.limit ?? 2;

    for (let i = 0; i < limit; i += 1) {
      await recordFeatureUsage(user._id, 'ai_generate_test');
    }

    await expect(assertFeatureAccess(user, 'ai_generate_test')).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      details: expect.objectContaining({ feature: 'ai_generate_test' }),
    });
  });

  it('allows pro users unlimited access', async () => {
    const user = await createTestUser({
      name: 'Pro User',
      email: 'pro@test.com',
      passwordHash: 'hash',
      role: 'student',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 86400000),
    });

    await recordFeatureUsage(user._id, 'ai_generate_test');
    await recordFeatureUsage(user._id, 'ai_generate_test');

    const access = await assertFeatureAccess(user, 'ai_generate_test');
    expect(access.unlimited).toBe(true);
  });

  it('blocks free users when ai evaluation quota is exhausted', async () => {
    const user = await createTestUser({
      name: 'Free User',
      email: 'free@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await expect(assertFeatureAccess(user, 'ai_evaluate')).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      details: expect.objectContaining({
        feature: 'ai_evaluate',
        paywallTitle: expect.stringContaining('evaluation'),
        paywallMessage: expect.stringMatching(/Upgrade to Sopaan Pro/i),
      }),
    });
  });

  it('tracks mock submissions in daily quota usage', async () => {
    const user = await createTestUser({
      name: 'Mock User',
      email: 'mock@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await recordFeatureUsage(user._id, 'mock_submit');

    const doc = await DailyQuotaUsage.findOne({ userId: user._id, dateKey: utcDateKey() }).lean();
    expect(doc?.counts?.mock_submit).toBe(1);
  });
});

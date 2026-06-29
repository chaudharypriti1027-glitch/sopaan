import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { User } from '../src/models/User.js';
import { Referral } from '../src/models/Referral.js';
import {
  applyReferralAtSignup,
  ensureUserReferralCode,
  markReferralOnboardingComplete,
  tryGrantReferralRewards,
} from '../src/services/referralService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('referral service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('generates a unique referral code for each user', async () => {
    const user = await createTestUser({
      name: 'Referrer',
      email: 'referrer@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const code = await ensureUserReferralCode(user._id);

    expect(code).toMatch(/^SOPAAN-[A-Z0-9]{6}$/);
  });

  it('blocks self-referral', async () => {
    const referrer = await createTestUser({
      name: 'Self',
      email: 'self@test.com',
      passwordHash: 'hash',
      role: 'student',
      referralCode: 'SOPAAN-SELF01',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });

    const result = await applyReferralAtSignup(referrer._id, referrer.referralCode);

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('self_referral');
  });

  it('rewards both users after onboarding and first test', async () => {
    const referrer = await createTestUser({
      name: 'Referrer',
      email: 'referrer@test.com',
      passwordHash: 'hash',
      role: 'student',
      referralCode: 'SOPAAN-GIFT01',
      coins: 0,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });

    const referee = await createTestUser({
      name: 'Referee',
      email: 'referee@test.com',
      passwordHash: 'hash',
      role: 'student',
      coins: 0,
    });

    const applied = await applyReferralAtSignup(referee._id, referrer.referralCode);
    expect(applied.applied).toBe(true);

    await markReferralOnboardingComplete(referee._id);

    const granted = await tryGrantReferralRewards(referee._id);
    expect(granted.granted).toBe(true);

    const [updatedReferrer, updatedReferee, referral] = await Promise.all([
      User.findById(referrer._id).lean(),
      User.findById(referee._id).lean(),
      Referral.findOne({ refereeId: referee._id }).lean(),
    ]);

    expect(updatedReferrer.coins).toBeGreaterThan(0);
    expect(updatedReferee.coins).toBeGreaterThan(0);
    expect(referral.status).toBe('rewarded');
  });
});

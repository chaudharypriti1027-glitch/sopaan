import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { SubscriptionEntitlement } from '../src/models/SubscriptionEntitlement.js';
import {
  activateEntitlementFromPayment,
  activateTrialEntitlement,
} from '../src/services/entitlementService.js';
import {
  ensurePlatformSettings,
  updatePlatformSettings,
} from '../src/services/platformSettingsService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';
import { withPrivacyConsent } from './helpers/privacy.js';

describe('welcome month offer + admin revoke', () => {
  let adminToken;

  beforeAll(async () => {
    process.env.WELCOME_MONTH_ON_SIGNUP = 'true';
    await setupTestDatabase();
  });

  afterAll(async () => {
    delete process.env.WELCOME_MONTH_ON_SIGNUP;
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    await ensurePlatformSettings();
    await updatePlatformSettings({ welcomeMonthEnabled: true });

    const seed = getSeedAdminUser();
    await createTestUser({
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      role: 'admin',
      password: seed.password,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: seed.email, password: seed.password })
      .expect(200);

    adminToken = login.body.token;
  });

  it('grants 1-month welcome Pro on signup when offer is enabled', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(
        withPrivacyConsent({
          name: 'Welcome Student',
          email: `welcome_${Date.now()}@test.com`,
          password: 'Password123!',
        }),
      )
      .expect(201);

    expect(signup.body.user.isPremium).toBe(true);
    expect(signup.body.user.premiumPlan).toBe('trial');
    expect(signup.body.user.premiumExpiresAt).toBeTruthy();
    expect(signup.body.user.premiumTrialUsed).toBe(true);

    const end = new Date(signup.body.user.premiumExpiresAt);
    const roughlyOneMonth = Date.now() + 25 * 24 * 60 * 60 * 1000;
    expect(end.getTime()).toBeGreaterThan(roughlyOneMonth);
  });

  it('admin can disable welcome offer going forward', async () => {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ welcomeMonthEnabled: false })
      .expect(200);

    const signup = await request(app)
      .post('/api/auth/signup')
      .send(
        withPrivacyConsent({
          name: 'No Welcome',
          email: `nowelcome_${Date.now()}@test.com`,
          password: 'Password123!',
        }),
      )
      .expect(201);

    expect(signup.body.user.isPremium).toBe(false);
    expect(signup.body.user.premiumPlan == null).toBe(true);
  });

  it('admin revoke cancels trial entitlements but leaves paid plans', async () => {
    const trialUser = await createTestUser({
      name: 'Trial Student',
      email: 'trial_revoke@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    await activateTrialEntitlement(trialUser._id);
    await User.findByIdAndUpdate(trialUser._id, {
      isPremium: true,
      premiumPlan: 'trial',
      premiumTrialUsed: true,
    });

    const paidUser = await createTestUser({
      name: 'Paid Student',
      email: 'paid_keep@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    await activateEntitlementFromPayment(paidUser._id, 'monthly');

    const res = await request(app)
      .post('/api/admin/settings/welcome-month/revoke')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.revoked).toBeGreaterThanOrEqual(1);

    const trialEnt = await SubscriptionEntitlement.findOne({ userId: trialUser._id });
    expect(trialEnt?.status).toBe('expired');
    expect((await User.findById(trialUser._id))?.isPremium).toBe(false);

    const paidEnt = await SubscriptionEntitlement.findOne({ userId: paidUser._id });
    expect(paidEnt?.status).toBe('active');
    expect(paidEnt?.plan).toBe('monthly');
    expect((await User.findById(paidUser._id))?.isPremium).toBe(true);
  });

  it('protects paid entitlement when denormalized user fields still say trial', async () => {
    const paidUser = await createTestUser({
      name: 'Stale Paid Student',
      email: 'stale_paid_keep@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    await activateEntitlementFromPayment(paidUser._id, 'yearly');
    await User.findByIdAndUpdate(paidUser._id, {
      isPremium: true,
      premiumPlan: 'trial',
    });

    const res = await request(app)
      .post('/api/admin/settings/welcome-month/revoke')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(res.body.paidUsersProtected).toBe(1);
    const entitlement = await SubscriptionEntitlement.findOne({ userId: paidUser._id });
    expect(entitlement?.status).toBe('active');
    expect(entitlement?.plan).toBe('yearly');
    const refreshedUser = await User.findById(paidUser._id);
    expect(refreshedUser?.isPremium).toBe(true);
    expect(refreshedUser?.premiumPlan).toBe('yearly');
  });

  it('rejects welcome-month revoke for non-admin', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send(
        withPrivacyConsent({
          name: 'Plain Student',
          email: `plain_${Date.now()}@test.com`,
          password: 'Password123!',
        }),
      );

    await request(app)
      .post('/api/admin/settings/welcome-month/revoke')
      .set('Authorization', `Bearer ${signup.body.accessToken}`)
      .send({})
      .expect(403);
  });
});

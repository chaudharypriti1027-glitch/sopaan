import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { getPlan } from '../src/config/premiumPlans.js';
import { getTierLimits } from '../src/config/freeTierConfig.js';
import {
  ensurePlatformSettings,
  getSettingsSnapshot,
} from '../src/services/platformSettingsService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';

describe('admin platform settings', () => {
  let adminToken;
  let fetchMock;

  beforeAll(async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (fetchMock) {
      global.fetch = fetchMock;
    }
  });

  beforeEach(async () => {
    await clearTestDatabase();
    await ensurePlatformSettings();

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

    fetchMock = global.fetch;
    global.fetch = jest.fn(async (url, options = {}) => {
      if (String(url).includes('api.razorpay.com/v1/orders')) {
        const body = JSON.parse(options.body ?? '{}');
        return {
          ok: true,
          json: async () => ({
            id: `order_${Date.now()}`,
            amount: body.amount,
            currency: 'INR',
          }),
        };
      }
      return fetchMock(url, options);
    });
  });

  it('returns platform settings with masked integrations', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.settings.freeAiQuota).toBe(10);
    expect(res.body.settings.proPriceMonthly).toBe(299);
    expect(typeof res.body.settings.welcomeMonthEnabled).toBe('boolean');
    expect(res.body.integrations.razorpay.editable).toBe(false);
    expect(res.body.integrations.anthropic.editable).toBe(false);
    expect(res.body.integrations.razorpay.source).toBe('env');
  });

  it('updates pro price and checkout uses the new amount', async () => {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ proPriceMonthly: 399 })
      .expect(200);

    expect(getSettingsSnapshot().proPriceMonthly).toBe(399);
    expect(getPlan('monthly').amountPaise).toBe(39900);

    const student = await createTestUser({ email: 'buyer@test.com' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ plan: 'monthly' })
      .expect(201);

    expect(order.body.amount).toBe(39900);
    expect(order.body.displayAmount).toBe('₹399');
  });

  it('updates free AI quota and enforcement uses the new limit', async () => {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freeAiQuota: 3 })
      .expect(200);

    expect(getTierLimits(false).aiDoubtsFastPerDay).toBe(3);

    const student = await createTestUser({ email: 'quota-user@test.com' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    const { AiDailyUsage } = await import('../src/models/AiDailyUsage.js');
    const { utcDateKey } = await import('../src/services/quotaService.js');

    await AiDailyUsage.findOneAndUpdate(
      { userId: student._id, dateKey: utcDateKey() },
      { $set: { fastCalls: 3 } },
      { upsert: true },
    );

    const blocked = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ question: 'What is GDP?', language: 'en' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('QUOTA_EXCEEDED');
    expect(blocked.body.error.details.limit).toBe(3);
  });

  it('rejects integration fields in settings update', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proPriceMonthly: 350,
        integrations: { razorpay: { keyId: 'hacked' } },
      })
      .expect(200);

    expect(res.body.settings.proPriceMonthly).toBe(350);
    expect(res.body.integrations.razorpay.editable).toBe(false);
  });
});

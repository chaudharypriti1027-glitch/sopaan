import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { PaymentOrder } from '../src/models/PaymentOrder.js';
import { countAudienceMembers } from '../src/services/admin/adminNotificationService.js';
import { getPlan } from '../src/config/premiumPlans.js';
import { activateEntitlementFromPayment } from '../src/services/entitlementService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';
import { subtractDays } from '../src/utils/testHelpers.js';

describe('admin hardening', () => {
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
      if (String(url).includes('api.razorpay.com/v1/payments/') && String(url).includes('/refund')) {
        return {
          ok: true,
          json: async () => ({ id: 'rfnd_test_1' }),
        };
      }
      return fetchMock(url, options);
    });
  });

  describe('role guards', () => {
    it('returns consistent FORBIDDEN shape for students on admin routes', async () => {
      const student = await createTestUser({ role: 'student' });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: student.email, password: 'Password123!' })
        .expect(200);

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${login.body.token}`)
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toMatch(/permissions/i);
    });

    it('blocks creators from admin-only revenue and settings routes', async () => {
      const creator = await createTestUser({ email: 'creator-guard@test.com', role: 'creator' });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: creator.email, password: 'Password123!' })
        .expect(200);

      const token = login.body.token;

      await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app)
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('returns VALIDATION_ERROR shape for invalid admin params', async () => {
      const res = await request(app)
        .delete('/api/admin/coupons/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('coupon validation', () => {
    it('rejects unknown coupon codes with INVALID_COUPON', async () => {
      const student = await createTestUser({ role: 'student' });
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: student.email, password: 'Password123!' })
        .expect(200);

      const order = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({ plan: 'monthly', couponCode: 'DOESNOTEXIST' })
        .expect(400);

      expect(order.body.error.code).toBe('INVALID_COUPON');
    });
  });

  describe('refund idempotency', () => {
    it('returns duplicate=true when refunding an already refunded order', async () => {
      const student = await createTestUser({ role: 'student' });
      await activateEntitlementFromPayment(student._id, 'monthly');

      const order = await PaymentOrder.create({
        userId: student._id,
        plan: 'monthly',
        amountPaise: getPlan('monthly').amountPaise,
        currency: 'INR',
        receipt: 'idem_receipt',
        razorpayOrderId: 'order_idem_refund',
        razorpayPaymentId: 'pay_idem_refund',
        status: 'paid',
      });

      const first = await request(app)
        .post(`/api/admin/transactions/${order._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(first.body.refunded).toBe(true);
      expect(first.body.duplicate).toBe(false);

      const second = await request(app)
        .post(`/api/admin/transactions/${order._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(second.body.refunded).toBe(true);
      expect(second.body.duplicate).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('push audience resolution', () => {
    it('counts free vs pro segments correctly', async () => {
      await createTestUser({ email: 'pro1@test.com', role: 'student', isPremium: true });
      await createTestUser({ email: 'free1@test.com', role: 'student', isPremium: false });
      await createTestUser({ email: 'free2@test.com', role: 'student', isPremium: false });

      expect(await countAudienceMembers('pro')).toBe(1);
      expect(await countAudienceMembers('free')).toBe(2);

      const proCount = await request(app)
        .get('/api/admin/notifications/audience-count?audience=pro')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(proCount.body.count).toBe(1);
      expect(proCount.body.audience).toBe('pro');
    });

    it('resolves active30d audience by recent streak activity', async () => {
      await createTestUser({
        email: 'active@test.com',
        role: 'student',
        streak: { count: 3, lastActiveOn: new Date() },
      });
      await createTestUser({
        email: 'inactive@test.com',
        role: 'student',
        streak: { count: 1, lastActiveOn: subtractDays(new Date(), 60) },
      });

      const count = await countAudienceMembers('active30d');
      expect(count).toBeGreaterThanOrEqual(1);

      const api = await request(app)
        .get('/api/admin/notifications/audience-count?audience=active30d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(api.body.count).toBe(count);
      expect(api.body.audience).toBe('active30d');
    });
  });

  describe('live token grants', () => {
    it('issues host publish grant for admin and viewer grant for student', async () => {
      const { resetStreamingProviderForTests, setStreamingProviderForTests } = await import(
        '../src/services/streaming/index.js'
      );

      setStreamingProviderForTests({
        id: 'mock',
        isConfigured: () => true,
        getConnectionUrl: () => 'wss://mock.livekit.cloud',
        createRoom: async ({ roomName }) => ({ roomName, provider: 'mock' }),
        createViewerToken: async () => ({
          token: 'viewer-token',
          url: 'wss://mock.livekit.cloud',
          canPublish: false,
          canSubscribe: true,
          canPublishData: true,
          role: 'student',
        }),
        createHostToken: async () => ({
          token: 'host-token',
          url: 'wss://mock.livekit.cloud',
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          role: 'host',
        }),
        getParticipantCount: async () => 1,
        startRecording: async () => ({ egressId: 'egress-1', recordingStatus: 'pending' }),
        stopRecording: async () => ({
          recordingUrl: 'https://recordings.example.com/class.mp4',
          recordingStatus: 'ready',
        }),
      });

      const created = await request(app)
        .post('/api/admin/live-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Token Grant Class',
          exam: 'SSC',
          startsAt: new Date().toISOString(),
          durationMin: 45,
        })
        .expect(201);

      await request(app)
        .post(`/api/admin/live-classes/${created.body.id}/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const hostToken = await request(app)
        .get(`/api/live/${created.body.id}/token`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(hostToken.body.token).toBe('host-token');
      expect(hostToken.body.canPublish).toBe(true);

      const student = await createTestUser({ role: 'student' });
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: student.email, password: 'Password123!' })
        .expect(200);

      const viewerToken = await request(app)
        .get(`/api/live/${created.body.id}/token`)
        .set('Authorization', `Bearer ${studentLogin.body.token}`)
        .expect(200);

      expect(viewerToken.body.token).toBe('viewer-token');
      expect(viewerToken.body.canPublish).toBe(false);

      resetStreamingProviderForTests();
    });
  });
});

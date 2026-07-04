import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app.js';
import { Coupon } from '../src/models/Coupon.js';
import { PaymentOrder } from '../src/models/PaymentOrder.js';
import { getPlan } from '../src/config/premiumPlans.js';
import { fulfillPaymentOrder } from '../src/services/razorpayService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

const WEBHOOK_SECRET = 'webhook_secret';

function signWebhookBody(rawBody) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

function paymentCapturedPayload({ orderId, paymentId, amountPaise, eventId }) {
  return {
    event: 'payment.captured',
    event_id: eventId ?? `evt_${paymentId}`,
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          status: 'captured',
          amount: amountPaise,
        },
      },
    },
  };
}

describe('coupons', () => {
  let fetchMock;

  beforeAll(async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
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
    fetchMock = global.fetch;
    global.fetch = jest.fn(async (url) => {
      if (typeof url === 'string' && url.includes('/payments/')) {
        const paymentId = url.split('/').pop();
        const order = await PaymentOrder.findOne({ razorpayPaymentId: paymentId }).catch(() => null);
        const latest = order ?? (await PaymentOrder.findOne({ status: 'created' }).sort({ createdAt: -1 }));

        return {
          ok: true,
          json: async () => ({
            id: paymentId,
            order_id: latest?.razorpayOrderId ?? 'order_unknown',
            status: 'captured',
            amount: latest?.amountPaise ?? getPlan('monthly').amountPaise,
          }),
        };
      }

      if (typeof url === 'string' && url.includes('/orders')) {
        const body = JSON.parse(
          global.fetch.mock.calls.find((call) => call[0] === url)?.[1]?.body ?? '{}',
        );
        return {
          ok: true,
          json: async () => ({
            id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            amount: body.amount ?? getPlan('monthly').amountPaise,
            currency: 'INR',
          }),
        };
      }

      return { ok: false, json: async () => ({ error: { description: 'not found' } }) };
    });
  });

  async function loginStudent() {
    const student = await createTestUser({
      email: `student-coupon-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    return { student, token: login.body.token };
  }

  async function loginAdmin() {
    const admin = await createTestUser({
      email: `admin-coupon-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
      name: 'Admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    return { admin, token: login.body.token };
  }

  async function createCouponViaAdmin(token, overrides = {}) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: overrides.code ?? 'SAVE20',
        type: overrides.type ?? 'percent',
        value: overrides.value ?? 20,
        usageLimit: overrides.usageLimit ?? 10,
        expiresAt: overrides.expiresAt ?? expiresAt,
      });
  }

  it('applies a valid coupon to POST /api/orders', async () => {
    const { token: adminToken } = await loginAdmin();
    await createCouponViaAdmin(adminToken);
    expect((await Coupon.findOne({ code: 'SAVE20' }))?.code).toBe('SAVE20');

    const { token } = await loginStudent();
    const plan = getPlan('monthly');
    const expectedDiscount = Math.floor((plan.amountPaise * 20) / 100);
    const expectedFinal = plan.amountPaise - expectedDiscount;

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly', couponCode: 'save20' })
      .expect(201);

    expect(order.body.amount).toBe(expectedFinal);
    expect(order.body.discountPaise).toBe(expectedDiscount);
    expect(order.body.coupon?.code).toBe('SAVE20');

    const stored = await PaymentOrder.findOne({ razorpayOrderId: order.body.orderId });
    expect(stored?.amountPaise).toBe(expectedFinal);
    expect(stored?.discountPaise).toBe(expectedDiscount);
    expect(stored?.couponCode).toBe('SAVE20');
    expect(stored?.couponRedeemed).toBe(false);
  });

  it('rejects expired coupons at checkout', async () => {
    const { token: adminToken } = await loginAdmin();
    const createdExpired = await createCouponViaAdmin(adminToken, {
      code: 'OLD10',
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(createdExpired.status).toBe(201);

    const { token } = await loginStudent();

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly', couponCode: 'OLD10' })
      .expect(400);

    expect(order.body.error?.code).toBe('COUPON_EXPIRED');
  });

  it('rejects coupons that reached usage limit', async () => {
    const { token: adminToken } = await loginAdmin();
    const created = await createCouponViaAdmin(adminToken, {
      code: 'MAXED',
      usageLimit: 2,
    });
    expect(created.status).toBe(201);

    await Coupon.findByIdAndUpdate(created.body.id, { $set: { usedCount: 2 } });

    const { token } = await loginStudent();

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly', couponCode: 'MAXED' })
      .expect(400);

    expect(order.body.error?.code).toBe('COUPON_LIMIT_REACHED');
  });

  it('increments usedCount only after successful payment', async () => {
    const { token: adminToken } = await loginAdmin();
    const createdPay = await createCouponViaAdmin(adminToken, { code: 'PAY20', usageLimit: 5 });
    expect(createdPay.status).toBe(201);

    const { token } = await loginStudent();

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly', couponCode: 'PAY20' })
      .expect(201);

    let coupon = await Coupon.findOne({ code: 'PAY20' });
    expect(coupon?.usedCount).toBe(0);

    const paymentId = 'pay_coupon_1';
    const rawBody = JSON.stringify(
      paymentCapturedPayload({
        orderId: order.body.orderId,
        paymentId,
        amountPaise: order.body.amount,
      }),
    );

    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhookBody(rawBody))
      .send(rawBody)
      .expect(200);

    coupon = await Coupon.findOne({ code: 'PAY20' });
    expect(coupon?.usedCount).toBe(1);

    const stored = await PaymentOrder.findOne({ razorpayOrderId: order.body.orderId });
    expect(stored?.couponRedeemed).toBe(true);

    await fulfillPaymentOrder(stored, paymentId, {
      event: 'replay',
      trustedPaymentEntity: {
        id: paymentId,
        order_id: order.body.orderId,
        status: 'captured',
        amount: order.body.amount,
      },
    });

    coupon = await Coupon.findOne({ code: 'PAY20' });
    expect(coupon?.usedCount).toBe(1);
  });

  it('supports admin coupon CRUD and deactivate', async () => {
    const { token } = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'ADMIN50',
        type: 'flat',
        value: 5000,
        usageLimit: 25,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(created.body.code).toBe('ADMIN50');
    expect(created.body.active).toBe(true);
    expect(created.body.usedCount).toBe(0);

    const listed = await request(app)
      .get('/api/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].usageLimit).toBe(25);

    const deactivated = await request(app)
      .patch(`/api/admin/coupons/${created.body.id}/active`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false })
      .expect(200);

    expect(deactivated.body.active).toBe(false);

    const { token: studentToken } = await loginStudent();

    const rejected = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'monthly', couponCode: 'ADMIN50' })
      .expect(400);

    expect(rejected.body.error?.code).toBe('COUPON_INACTIVE');
  });
});

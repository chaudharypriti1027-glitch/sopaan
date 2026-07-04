import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app.js';
import { PaymentOrder } from '../src/models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../src/models/SubscriptionEntitlement.js';
import { User } from '../src/models/User.js';
import { getPlan } from '../src/config/premiumPlans.js';
import { activateEntitlementFromPayment } from '../src/services/entitlementService.js';
import { getRevenueSummary } from '../src/services/admin/adminRevenueService.js';
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

describe('admin revenue and transactions', () => {
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
    global.fetch = jest.fn(async (url, options = {}) => {
      if (typeof url === 'string' && url.includes('/payments/') && url.includes('/refund')) {
        return {
          ok: true,
          json: async () => ({
            id: `rfnd_${Date.now()}`,
            payment_id: url.split('/')[5],
            amount: JSON.parse(options.body ?? '{}').amount,
            status: 'processed',
          }),
        };
      }

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
        const body = JSON.parse(options.body ?? '{}');
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

  async function loginAdmin() {
    const admin = await createTestUser({
      email: `admin-revenue-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
      name: 'Revenue Admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    return { admin, token: login.body.token };
  }

  async function loginStudent(emailSuffix = Date.now()) {
    const student = await createTestUser({
      email: `student-revenue-${emailSuffix}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Revenue Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    return { student, token: login.body.token };
  }

  it('returns revenue metrics that match paid subscriptions and refunds', async () => {
    const monthly = await createTestUser({
      email: 'monthly-mrr@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    const yearly = await createTestUser({
      email: 'yearly-mrr@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    const trial = await createTestUser({
      email: 'trial-mrr@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateEntitlementFromPayment(monthly._id, 'monthly');
    await activateEntitlementFromPayment(yearly._id, 'yearly');
    await activateEntitlementFromPayment(trial._id, 'monthly');
    await SubscriptionEntitlement.findOneAndUpdate(
      { userId: trial._id },
      { $set: { plan: 'trial', status: 'trialing' } },
    );

    await PaymentOrder.create({
      userId: monthly._id,
      plan: 'monthly',
      amountPaise: getPlan('monthly').amountPaise,
      currency: 'INR',
      receipt: 'refund_receipt',
      razorpayOrderId: 'order_refund_metric',
      razorpayPaymentId: 'pay_refund_metric',
      status: 'refunded',
      updatedAt: new Date(),
    });

    const summary = await getRevenueSummary();
    const expectedMrr =
      getPlan('monthly').amountPaise + Math.round(getPlan('yearly').amountPaise / 12);

    expect(summary.mrr).toBe(expectedMrr);
    expect(summary.activeSubs).toBe(2);
    expect(summary.arpu).toBe(Math.round(expectedMrr / 2));
    expect(summary.refunds30d).toBe(1);
  });

  it('lists transactions and refunds via admin API with entitlement revocation', async () => {
    const { token: adminToken } = await loginAdmin();
    const { student, token: studentToken } = await loginStudent();

    const createOrder = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'monthly' })
      .expect(201);

    const orderId = createOrder.body.orderId;
    const paymentId = 'pay_admin_refund_1';
    const amountPaise = getPlan('monthly').amountPaise;
    const rawBody = JSON.stringify(
      paymentCapturedPayload({ orderId, paymentId, amountPaise, eventId: 'evt_admin_refund' }),
    );

    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhookBody(rawBody))
      .send(rawBody)
      .expect(200);

    const entitlementBefore = await SubscriptionEntitlement.findOne({ userId: student._id });
    expect(entitlementBefore?.status).toBe('active');

    const listed = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].status).toBe('paid');
    expect(listed.body.items[0].canRefund).toBe(true);

    const revenue = await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(revenue.body.mrr).toBe(getPlan('monthly').amountPaise);
    expect(revenue.body.activeSubs).toBe(1);

    const refunded = await request(app)
      .post(`/api/admin/transactions/${listed.body.items[0].id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(refunded.body.refunded).toBe(true);
    expect(refunded.body.refundId).toMatch(/^rfnd_/);
    expect(refunded.body.transaction.status).toBe('refunded');

    const order = await PaymentOrder.findOne({ userId: student._id });
    expect(order?.status).toBe('refunded');

    const user = await User.findById(student._id);
    expect(user?.isPremium).toBe(false);

    const entitlementAfter = await SubscriptionEntitlement.findOne({ userId: student._id });
    expect(entitlementAfter?.status).toBe('expired');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/payments/${paymentId}/refund`),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends a reminder for pending transactions', async () => {
    const { token: adminToken } = await loginAdmin();
    const { token: studentToken } = await loginStudent('remind');

    const createOrder = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'yearly' })
      .expect(201);

    const listed = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pending = listed.body.items.find((row) => row.orderId === createOrder.body.orderId);
    expect(pending?.canRemind).toBe(true);

    const reminded = await request(app)
      .post(`/api/admin/transactions/${pending.id}/remind`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(reminded.body.reminded).toBe(true);
    expect(reminded.body.studentName).toBe('Revenue Student');
  });
});

import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app.js';
import { PaymentOrder } from '../src/models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../src/models/SubscriptionEntitlement.js';
import { User } from '../src/models/User.js';
import { getPlan } from '../src/config/premiumPlans.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

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

async function signupUser() {
  const signup = await request(app)
    .post('/api/auth/signup')
    .send(
      withPrivacyConsent({
        name: 'Webhook User',
        email: `webhook_${Date.now()}@test.com`,
        password: 'Password123',
      }),
    );

  return {
    token: signup.body.accessToken,
    userId: signup.body.user.id,
  };
}

describe('Razorpay payment webhook', () => {
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
        const byPayment = order ?? (await PaymentOrder.findOne({ status: 'created' }).sort({ createdAt: -1 }));

        return {
          ok: true,
          json: async () => ({
            id: paymentId,
            order_id: byPayment?.razorpayOrderId ?? 'order_unknown',
            status: 'captured',
            amount: byPayment?.amountPaise ?? getPlan('monthly').amountPaise,
          }),
        };
      }

      if (typeof url === 'string' && url.includes('/orders')) {
        return {
          ok: true,
          json: async () => ({
            id: `order_${Date.now()}`,
            amount: getPlan('monthly').amountPaise,
            currency: 'INR',
          }),
        };
      }

      return { ok: false, json: async () => ({ error: { description: 'not found' } }) };
    });
  });

  it('rejects tampered webhook signatures', async () => {
    const rawBody = JSON.stringify(paymentCapturedPayload({
      orderId: 'order_bad',
      paymentId: 'pay_bad',
      amountPaise: 29900,
    }));

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'invalid_signature')
      .send(rawBody);

    expect(response.status).toBe(401);
    expect(response.body.error?.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('grants entitlement once on payment.captured and ignores replay', async () => {
    const { token, userId } = await signupUser();

    const createOrder = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly' });

    const orderId = createOrder.body.orderId;
    const paymentId = 'pay_webhook_1';
    const amountPaise = getPlan('monthly').amountPaise;
    const payload = paymentCapturedPayload({ orderId, paymentId, amountPaise });
    const rawBody = JSON.stringify(payload);
    const signature = signWebhookBody(rawBody);

    const first = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBe(false);

    const entitlement = await SubscriptionEntitlement.findOne({ userId });
    expect(entitlement?.status).toBe('active');
    expect(entitlement?.plan).toBe('monthly');

    const user = await User.findById(userId);
    expect(user?.isPremium).toBe(true);

    const replay = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);

    const entitlementCount = await SubscriptionEntitlement.countDocuments({ userId });
    expect(entitlementCount).toBe(1);
  });

  it('does not grant on client verify — webhook is source of truth', async () => {
    const { token, userId } = await signupUser();

    const createOrder = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly' });

    const orderId = createOrder.body.orderId;
    const paymentId = 'pay_client_only';
    const payload = `${orderId}|${paymentId}`;
    const clientSignature = crypto
      .createHmac('sha256', 'test_secret')
      .update(payload)
      .digest('hex');

    const verify = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: clientSignature,
      });

    expect(verify.status).toBe(200);
    expect(verify.body.verified).toBe(true);
    expect(verify.body.pending).toBe(true);
    expect(verify.body.active).toBe(false);

    const userBeforeWebhook = await User.findById(userId);
    expect(userBeforeWebhook?.isPremium).toBe(false);

    const webhookPayload = paymentCapturedPayload({
      orderId,
      paymentId,
      amountPaise: getPlan('monthly').amountPaise,
      eventId: 'evt_client_flow',
    });
    const rawBody = JSON.stringify(webhookPayload);
    const signature = signWebhookBody(rawBody);

    const webhook = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(webhook.status).toBe(200);

    const userAfterWebhook = await User.findById(userId);
    expect(userAfterWebhook?.isPremium).toBe(true);
  });

  it('revokes entitlement on payment.refunded', async () => {
    const { token, userId } = await signupUser();

    const createOrder = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'monthly' });

    const orderId = createOrder.body.orderId;
    const paymentId = 'pay_refund_1';
    const capturePayload = paymentCapturedPayload({
      orderId,
      paymentId,
      amountPaise: getPlan('monthly').amountPaise,
      eventId: 'evt_capture_refund',
    });
    const captureBody = JSON.stringify(capturePayload);
    const captureSig = signWebhookBody(captureBody);

    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', captureSig)
      .send(captureBody);

    expect((await User.findById(userId))?.isPremium).toBe(true);

    const refundPayload = {
      event: 'payment.refunded',
      event_id: 'evt_refund_1',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            status: 'refunded',
            amount: getPlan('monthly').amountPaise,
          },
        },
      },
    };
    const refundBody = JSON.stringify(refundPayload);
    const refundSig = signWebhookBody(refundBody);

    const refund = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', refundSig)
      .send(refundBody);

    expect(refund.status).toBe(200);

    const order = await PaymentOrder.findOne({ razorpayOrderId: orderId });
    expect(order?.status).toBe('refunded');

    const user = await User.findById(userId);
    expect(user?.isPremium).toBe(false);

    const entitlement = await SubscriptionEntitlement.findOne({ userId });
    expect(entitlement?.status).toBe('expired');
  });
});

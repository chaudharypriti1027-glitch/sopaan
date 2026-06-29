import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import crypto from 'crypto';
import { User } from '../src/models/User.js';
import { PaymentOrder } from '../src/models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../src/models/SubscriptionEntitlement.js';
import {
  activateEntitlementFromPayment,
  activateTrialEntitlement,
  cancelEntitlement,
  entitlementGrantsAccess,
  expireEntitlement,
  formatEntitlementDto,
  getEntitlementByUserId,
  restoreEntitlementsForUser,
} from '../src/services/entitlementService.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../src/services/razorpayService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('subscription entitlement service', () => {
  beforeAll(async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('creates trial entitlement and syncs user fields', async () => {
    const user = await createTestUser({
      name: 'Trial User',
      email: 'trial@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateTrialEntitlement(user._id);
    const entitlement = await getEntitlementByUserId(user._id);
    const synced = await User.findById(user._id);

    expect(entitlement?.status).toBe('trialing');
    expect(entitlement?.plan).toBe('trial');
    expect(entitlementGrantsAccess(entitlement)).toBe(true);
    expect(synced?.isPremium).toBe(true);
    expect(synced?.premiumPlan).toBe('trial');
  });

  it('extends period on renewal payment', async () => {
    const user = await createTestUser({
      name: 'Renew User',
      email: 'renew@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateEntitlementFromPayment(user._id, 'monthly', { event: 'first_payment' });
    const first = await getEntitlementByUserId(user._id);
    const firstEnd = new Date(first.currentPeriodEnd);

    await activateEntitlementFromPayment(user._id, 'monthly', { event: 'renewal' });
    const renewed = await getEntitlementByUserId(user._id);

    expect(new Date(renewed.currentPeriodEnd).getTime()).toBeGreaterThan(firstEnd.getTime());
    expect(renewed.status).toBe('active');
  });

  it('marks cancelled entitlement with access until period end', async () => {
    const user = await createTestUser({
      name: 'Cancel User',
      email: 'cancel@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateEntitlementFromPayment(user._id, 'yearly');
    await cancelEntitlement(user._id, { atPeriodEnd: true });
    const entitlement = await getEntitlementByUserId(user._id);

    expect(entitlement?.status).toBe('cancelled');
    expect(entitlement?.cancelAtPeriodEnd).toBe(true);
    expect(entitlementGrantsAccess(entitlement)).toBe(true);
  });

  it('expires entitlement and removes premium access', async () => {
    const user = await createTestUser({
      name: 'Expire User',
      email: 'expire@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateTrialEntitlement(user._id);
    await expireEntitlement(user._id);
    const entitlement = await getEntitlementByUserId(user._id);
    const synced = await User.findById(user._id);

    expect(entitlement?.status).toBe('expired');
    expect(entitlementGrantsAccess(entitlement)).toBe(false);
    expect(synced?.isPremium).toBe(false);
  });

  it('restores purchases from paid orders', async () => {
    const user = await createTestUser({
      name: 'Restore User',
      email: 'restore@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await PaymentOrder.create({
      userId: user._id,
      plan: 'yearly',
      amountPaise: 249900,
      currency: 'INR',
      receipt: 'restore_receipt',
      razorpayOrderId: 'order_restore_1',
      razorpayPaymentId: 'pay_restore_1',
      status: 'paid',
    });

    const result = await restoreEntitlementsForUser(user._id);

    expect(result.restoredOrders).toBe(1);
    expect(result.entitlement?.plan).toBe('yearly');
    expect(result.user.isPremium).toBe(true);
  });

  it('formats entitlement dto for clients', async () => {
    const user = await createTestUser({
      name: 'Dto User',
      email: 'dto@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await activateEntitlementFromPayment(user._id, 'monthly');
    const dto = formatEntitlementDto(await SubscriptionEntitlement.findOne({ userId: user._id }));

    expect(dto).toMatchObject({
      plan: 'monthly',
      status: 'active',
      hasAccess: true,
    });
    expect(dto.currentPeriodEnd).toBeTruthy();
  });
});

describe('payment signature verification', () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
  });

  it('verifies razorpay payment signatures', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const payload = `${orderId}|${paymentId}`;
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(payload)
      .digest('hex');

    expect(verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
    expect(verifyPaymentSignature(orderId, paymentId, 'bad')).toBe(false);
  });

  it('verifies webhook signatures from raw body', () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const signature = crypto.createHmac('sha256', 'webhook_secret').update(rawBody).digest('hex');

    expect(verifyWebhookSignature(rawBody, signature)).toBe(true);
    expect(verifyWebhookSignature(rawBody, 'invalid')).toBe(false);
  });
});

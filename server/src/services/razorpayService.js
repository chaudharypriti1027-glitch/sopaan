import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { BillingWebhookEvent } from '../models/BillingWebhookEvent.js';
import { getPlan } from '../config/premiumPlans.js';
import {
  activateEntitlementFromPayment,
  cancelEntitlement,
  entitlementGrantsAccess,
  expireEntitlement,
  getEntitlementByUserId,
  linkProviderSubscription,
  markEntitlementPastDue,
  revokeEntitlementFromRefund,
  syncUserPremiumFields,
} from './entitlementService.js';
import { createNotification } from './notificationService.js';
import { User } from '../models/User.js';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new AppError(
      'Payment gateway is not configured on the server',
      503,
      'PAYMENTS_NOT_CONFIGURED',
    );
  }

  return { keyId, keySecret };
}

function authHeader(keyId, keySecret) {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return `Basic ${token}`;
}

export function getPublicKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new AppError(
      'Payment gateway is not configured on the server',
      503,
      'PAYMENTS_NOT_CONFIGURED',
    );
  }
  return keyId;
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const { keySecret } = getRazorpayCredentials();
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new AppError('Webhook secret is not configured', 503, 'WEBHOOK_NOT_CONFIGURED');
  }

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

async function razorpayFetch(path, options = {}) {
  const { keyId, keySecret } = getRazorpayCredentials();

  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(keyId, keySecret),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[razorpay] API error:', data);
    throw new AppError(
      data?.error?.description ?? 'Payment provider error',
      502,
      'RAZORPAY_ERROR',
    );
  }

  return data;
}

export async function createRazorpayOrder(userId, planId) {
  const plan = getPlan(planId);

  if (!plan) {
    throw new AppError('Invalid subscription plan', 400, 'INVALID_PLAN');
  }

  const receipt = `sopaan_${userId}_${Date.now()}`;

  const razorpayOrder = await razorpayFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: userId.toString(),
        plan: plan.id,
      },
    }),
  });

  await PaymentOrder.create({
    userId,
    plan: plan.id,
    amountPaise: plan.amountPaise,
    currency: 'INR',
    receipt,
    razorpayOrderId: razorpayOrder.id,
    status: 'created',
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: getPublicKeyId(),
    plan: plan.id,
    displayAmount: plan.displayAmount,
    receipt,
  };
}

async function fetchRazorpayPayment(paymentId) {
  return razorpayFetch(`/payments/${paymentId}`);
}

function formatUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isPremium: user.isPremium,
    premiumPlan: user.premiumPlan ?? null,
    premiumExpiresAt: user.premiumExpiresAt ?? null,
    coins: user.coins,
    streak: user.streak,
  };
}

function webhookIdempotencyKey(eventType, paymentEntity, subscriptionEntity, fallbackEventId) {
  if (paymentEntity?.id) {
    return `payment:${paymentEntity.id}`;
  }

  if (subscriptionEntity?.id) {
    return `subscription:${subscriptionEntity.id}:${eventType}`;
  }

  return fallbackEventId;
}

async function recordWebhookEvent(eventId, eventType, payloadSummary) {
  try {
    await BillingWebhookEvent.create({
      eventId,
      eventType,
      payloadSummary,
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) {
      return false;
    }
    throw err;
  }
}

export async function fulfillPaymentOrder(order, paymentId, options = {}) {
  if (order.status === 'paid' && order.razorpayPaymentId === paymentId) {
    return { alreadyFulfilled: true, order };
  }

  if (order.status === 'paid') {
    return { alreadyFulfilled: true, order };
  }

  if (order.status === 'refunded') {
    throw new AppError('Order was refunded', 409, 'ORDER_REFUNDED');
  }

  const payment = options.trustedPaymentEntity ?? (await fetchRazorpayPayment(paymentId));

  if (payment.order_id !== order.razorpayOrderId) {
    throw new AppError('Payment does not match order', 400, 'ORDER_MISMATCH');
  }

  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    throw new AppError('Payment not completed', 400, 'PAYMENT_NOT_CAPTURED');
  }

  if (payment.amount !== order.amountPaise) {
    throw new AppError('Payment amount mismatch', 400, 'AMOUNT_MISMATCH');
  }

  order.status = 'paid';
  order.razorpayPaymentId = paymentId;
  await order.save();

  await activateEntitlementFromPayment(order.userId, order.plan, {
    paymentOrderId: order._id,
    paymentId,
    event: options.event ?? 'payment_captured',
  });

  const user = await User.findById(order.userId);

  if (!options.skipNotification) {
    await createNotification(order.userId, {
      type: 'premium_activated',
      title: 'Welcome to Sopaan Pro',
      body: `Your ${order.plan} plan is active. Happy studying!`,
      data: { plan: order.plan },
    });
  }

  return {
    alreadyFulfilled: false,
    order,
    user: formatUserResponse(user),
    plan: order.plan,
    paymentId,
  };
}

/**
 * Client callback — signature check + UX status only. Entitlements are granted by webhook.
 */
export async function verifyAndActivatePremium(userId, _userName, {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    throw new AppError('Invalid payment signature', 400, 'INVALID_SIGNATURE');
  }

  const order = await PaymentOrder.findOne({
    razorpayOrderId: razorpay_order_id,
    userId,
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  if (order.status === 'paid') {
    const user = await syncUserPremiumFields(userId);
    return {
      verified: true,
      active: true,
      pending: false,
      user: formatUserResponse(user),
      plan: order.plan,
      paymentId: order.razorpayPaymentId,
      alreadyFulfilled: true,
    };
  }

  const payment = await fetchRazorpayPayment(razorpay_payment_id);

  if (payment.order_id !== order.razorpayOrderId) {
    throw new AppError('Payment does not match order', 400, 'ORDER_MISMATCH');
  }

  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    throw new AppError('Payment not completed yet', 402, 'PAYMENT_PENDING');
  }

  const entitlement = await getEntitlementByUserId(userId);
  const user = await syncUserPremiumFields(userId);
  const active = entitlementGrantsAccess(entitlement);

  return {
    verified: true,
    active,
    pending: !active,
    user: formatUserResponse(user),
    plan: order.plan,
    paymentId: razorpay_payment_id,
    alreadyFulfilled: false,
    message:
      'Payment verified. Pro access activates when the billing webhook is processed (usually within seconds).',
  };
}

async function markOrderFailed(orderId, reason) {
  const order = await PaymentOrder.findOne({ razorpayOrderId: orderId });
  if (!order || order.status === 'paid' || order.status === 'refunded') {
    return null;
  }

  order.status = 'failed';
  order.failureReason = reason;
  await order.save();
  return order;
}

async function markOrderRefunded(order, paymentId, reason) {
  if (!order || order.status === 'refunded') {
    return order;
  }

  order.status = 'refunded';
  order.razorpayPaymentId = order.razorpayPaymentId ?? paymentId;
  order.failureReason = reason;
  await order.save();
  return order;
}

function subscriptionPlanFromNotes(notes = {}) {
  const plan = notes.plan ?? notes.plan_id;
  if (plan === 'yearly' || plan === 'monthly') {
    return plan;
  }
  return 'monthly';
}

export async function handleRazorpayWebhook(rawBody, signature) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 401, 'INVALID_WEBHOOK_SIGNATURE');
  }

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const payload = JSON.parse(body.toString('utf8'));
  const eventType = payload.event;
  const fallbackEventId = payload.event_id ?? `${eventType}:${payload.created_at}`;
  const paymentEntity = payload.payload?.payment?.entity;
  const subscriptionEntity = payload.payload?.subscription?.entity;
  const idempotencyKey = webhookIdempotencyKey(
    eventType,
    paymentEntity,
    subscriptionEntity,
    fallbackEventId,
  );

  const isNew = await recordWebhookEvent(idempotencyKey, eventType, {
    entity: paymentEntity?.id ?? subscriptionEntity?.id,
    razorpayEventId: fallbackEventId,
  });

  if (!isNew) {
    return { handled: true, duplicate: true, eventType, idempotencyKey };
  }

  switch (eventType) {
    case 'payment.captured': {
      if (!paymentEntity?.order_id || !paymentEntity?.id) {
        break;
      }
      const order = await PaymentOrder.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order) {
        await fulfillPaymentOrder(order, paymentEntity.id, {
          event: 'webhook_payment_captured',
          skipNotification: false,
          trustedPaymentEntity: paymentEntity,
        });
      }
      break;
    }
    case 'payment.failed': {
      if (paymentEntity?.order_id) {
        const order = await markOrderFailed(
          paymentEntity.order_id,
          paymentEntity.error_description,
        );
        if (order) {
          await markEntitlementPastDue(
            order.userId,
            paymentEntity.error_description ?? 'payment_failed',
          );
        }
      }
      break;
    }
    case 'payment.refunded':
    case 'refund.processed': {
      if (!paymentEntity?.id && !paymentEntity?.order_id) {
        break;
      }

      const order =
        (paymentEntity.id
          ? await PaymentOrder.findOne({ razorpayPaymentId: paymentEntity.id })
          : null) ??
        (paymentEntity.order_id
          ? await PaymentOrder.findOne({ razorpayOrderId: paymentEntity.order_id })
          : null);

      if (order) {
        await markOrderRefunded(order, paymentEntity.id, eventType);
        await revokeEntitlementFromRefund(order.userId, {
          paymentId: paymentEntity.id,
          reason: eventType,
        });
      }
      break;
    }
    case 'subscription.authenticated':
    case 'subscription.activated':
    case 'subscription.created': {
      if (!subscriptionEntity?.id) {
        break;
      }
      const userId = subscriptionEntity.notes?.userId;
      if (userId) {
        await linkProviderSubscription(
          userId,
          subscriptionEntity.id,
          subscriptionPlanFromNotes(subscriptionEntity.notes),
        );
      }
      break;
    }
    case 'subscription.charged': {
      if (!subscriptionEntity?.id) {
        break;
      }
      const userId = subscriptionEntity.notes?.userId;
      const plan = subscriptionPlanFromNotes(subscriptionEntity.notes);
      if (userId) {
        await activateEntitlementFromPayment(userId, plan, {
          providerSubscriptionId: subscriptionEntity.id,
          paymentId: paymentEntity?.id,
          event: 'subscription_renewed',
        });
      }
      break;
    }
    case 'subscription.pending':
    case 'subscription.halted': {
      const userId = subscriptionEntity?.notes?.userId;
      if (userId) {
        await markEntitlementPastDue(userId, eventType);
      }
      break;
    }
    case 'subscription.cancelled': {
      const userId = subscriptionEntity?.notes?.userId;
      if (userId) {
        await cancelEntitlement(userId, { atPeriodEnd: true });
      }
      break;
    }
    case 'subscription.completed':
    case 'subscription.expired': {
      const userId = subscriptionEntity?.notes?.userId;
      if (userId) {
        await expireEntitlement(userId, eventType);
      }
      break;
    }
    default:
      break;
  }

  return { handled: true, duplicate: false, eventType, idempotencyKey };
}

import { User } from '../models/User.js';
import {
  ENTITLEMENT_PLANS,
  ENTITLEMENT_STATUSES,
  SubscriptionEntitlement,
} from '../models/SubscriptionEntitlement.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { computePremiumExpiry } from './premiumService.js';

function nowDate() {
  return new Date();
}

export function entitlementGrantsAccess(entitlement, at = nowDate()) {
  if (!entitlement) {
    return false;
  }

  if (entitlement.status === 'expired') {
    return false;
  }

  if (!entitlement.currentPeriodEnd || new Date(entitlement.currentPeriodEnd) <= at) {
    return false;
  }

  return ['trialing', 'active', 'past_due', 'cancelled'].includes(entitlement.status);
}

export async function syncUserPremiumFields(userId) {
  const entitlement = await SubscriptionEntitlement.findOne({ userId });
  const hasAccess = entitlementGrantsAccess(entitlement);

  const update = {
    isPremium: hasAccess,
    premiumPlan: hasAccess ? entitlement.plan : null,
    premiumExpiresAt: hasAccess ? entitlement.currentPeriodEnd : null,
  };

  await User.findByIdAndUpdate(userId, update);
  return User.findById(userId);
}

export async function reconcileEntitlementExpiry(entitlement) {
  if (!entitlement) {
    return null;
  }

  const expiredByDate =
    entitlement.currentPeriodEnd && new Date(entitlement.currentPeriodEnd) <= nowDate();

  if (
    expiredByDate &&
    ['trialing', 'active', 'past_due', 'cancelled'].includes(entitlement.status)
  ) {
    entitlement.status = 'expired';
    await entitlement.save();
    await syncUserPremiumFields(entitlement.userId);
  }

  return entitlement;
}

export async function getEntitlementByUserId(userId) {
  const entitlement = await SubscriptionEntitlement.findOne({ userId });
  return reconcileEntitlementExpiry(entitlement);
}

export function formatEntitlementDto(entitlement) {
  if (!entitlement) {
    return null;
  }

  return {
    id: entitlement._id,
    plan: entitlement.plan,
    status: entitlement.status,
    currentPeriodStart: entitlement.currentPeriodStart,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    cancelAtPeriodEnd: entitlement.cancelAtPeriodEnd,
    cancelledAt: entitlement.cancelledAt,
    provider: entitlement.provider,
    providerSubscriptionId: entitlement.providerSubscriptionId,
    autoRenews: Boolean(entitlement.providerSubscriptionId) && !entitlement.cancelAtPeriodEnd,
    hasAccess: entitlementGrantsAccess(entitlement),
    updatedAt: entitlement.updatedAt,
  };
}

async function upsertEntitlement(userId, patch) {
  const existing = await SubscriptionEntitlement.findOne({ userId });

  if (existing) {
    Object.assign(existing, patch);
    await existing.save();
    await syncUserPremiumFields(userId);
    return existing;
  }

  const created = await SubscriptionEntitlement.create({
    userId,
    ...patch,
  });
  await syncUserPremiumFields(userId);
  return created;
}

export async function activateEntitlementFromPayment(userId, plan, options = {}) {
  if (!ENTITLEMENT_PLANS.includes(plan) || plan === 'trial') {
    throw new Error(`Invalid paid plan: ${plan}`);
  }

  const existing = await getEntitlementByUserId(userId);
  const now = nowDate();
  const periodStart =
    existing?.currentPeriodEnd && new Date(existing.currentPeriodEnd) > now
      ? existing.currentPeriodStart
      : now;
  const baseDate =
    existing?.currentPeriodEnd && new Date(existing.currentPeriodEnd) > now
      ? new Date(existing.currentPeriodEnd)
      : now;
  const periodEnd = computePremiumExpiry(plan, baseDate);

  const entitlement = await upsertEntitlement(userId, {
    plan,
    status: 'active',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    lastPaymentOrderId: options.paymentOrderId ?? null,
    lastPaymentId: options.paymentId ?? null,
    providerSubscriptionId: options.providerSubscriptionId ?? existing?.providerSubscriptionId ?? null,
    providerCustomerId: options.providerCustomerId ?? existing?.providerCustomerId ?? null,
    metadata: {
      ...(existing?.metadata ?? {}),
      lastEvent: options.event ?? 'payment_captured',
      renewed: Boolean(existing && entitlementGrantsAccess(existing)),
    },
  });

  return entitlement;
}

export async function activateTrialEntitlement(userId) {
  const now = nowDate();
  const periodEnd = computePremiumExpiry('trial', now);

  return upsertEntitlement(userId, {
    plan: 'trial',
    status: 'trialing',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    metadata: { lastEvent: 'trial_started' },
  });
}

export async function extendEntitlementPeriod(userId, plan, extraDays = 0) {
  const existing = await getEntitlementByUserId(userId);
  if (!existing) {
    return null;
  }

  const base = existing.currentPeriodEnd && new Date(existing.currentPeriodEnd) > nowDate()
    ? new Date(existing.currentPeriodEnd)
    : nowDate();
  const periodEnd = computePremiumExpiry(plan, base);

  if (extraDays > 0) {
    periodEnd.setDate(periodEnd.getDate() + extraDays);
  }

  existing.currentPeriodEnd = periodEnd;
  existing.status = existing.status === 'trialing' ? 'trialing' : 'active';
  existing.metadata = {
    ...(existing.metadata ?? {}),
    lastEvent: 'period_extended',
  };
  await existing.save();
  await syncUserPremiumFields(userId);
  return existing;
}

export async function markEntitlementPastDue(userId, reason = 'payment_failed') {
  const entitlement = await getEntitlementByUserId(userId);
  if (!entitlement || entitlement.status === 'expired') {
    return null;
  }

  entitlement.status = 'past_due';
  entitlement.metadata = {
    ...(entitlement.metadata ?? {}),
    lastEvent: 'payment_failed',
    failureReason: reason,
  };
  await entitlement.save();
  await syncUserPremiumFields(userId);
  return entitlement;
}

export async function cancelEntitlement(userId, { atPeriodEnd = true } = {}) {
  const entitlement = await getEntitlementByUserId(userId);
  if (!entitlement) {
    return null;
  }

  entitlement.cancelAtPeriodEnd = atPeriodEnd;
  entitlement.cancelledAt = nowDate();
  entitlement.status = atPeriodEnd ? 'cancelled' : 'expired';
  entitlement.metadata = {
    ...(entitlement.metadata ?? {}),
    lastEvent: atPeriodEnd ? 'cancelled_at_period_end' : 'cancelled_immediately',
  };

  if (!atPeriodEnd) {
    entitlement.currentPeriodEnd = nowDate();
  }

  await entitlement.save();
  await syncUserPremiumFields(userId);
  return entitlement;
}

export async function revokeEntitlementFromRefund(userId, { reason = 'refunded', paymentId } = {}) {
  const entitlement = await getEntitlementByUserId(userId);
  if (!entitlement) {
    return null;
  }

  entitlement.status = 'expired';
  entitlement.currentPeriodEnd = nowDate();
  entitlement.metadata = {
    ...(entitlement.metadata ?? {}),
    lastEvent: reason,
    lastPaymentId: paymentId ?? entitlement.lastPaymentId,
  };
  await entitlement.save();
  await syncUserPremiumFields(userId);
  return entitlement;
}

export async function expireEntitlement(userId, reason = 'expired') {
  const entitlement = await getEntitlementByUserId(userId);
  if (!entitlement) {
    return null;
  }

  entitlement.status = 'expired';
  entitlement.metadata = {
    ...(entitlement.metadata ?? {}),
    lastEvent: reason,
  };
  await entitlement.save();
  await syncUserPremiumFields(userId);
  return entitlement;
}

export async function linkProviderSubscription(userId, providerSubscriptionId, plan) {
  const entitlement = await getEntitlementByUserId(userId);
  if (!entitlement) {
    const now = nowDate();
    return upsertEntitlement(userId, {
      plan: plan ?? 'monthly',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: computePremiumExpiry(plan ?? 'monthly', now),
      providerSubscriptionId,
      metadata: { lastEvent: 'subscription_created' },
    });
  }

  entitlement.providerSubscriptionId = providerSubscriptionId;
  if (plan) {
    entitlement.plan = plan;
  }
  entitlement.status = entitlement.status === 'trialing' ? entitlement.status : 'active';
  entitlement.metadata = {
    ...(entitlement.metadata ?? {}),
    lastEvent: 'subscription_linked',
  };
  await entitlement.save();
  await syncUserPremiumFields(userId);
  return entitlement;
}

export async function restoreEntitlementsForUser(userId) {
  const paidOrders = await PaymentOrder.find({ userId, status: 'paid' })
    .sort({ createdAt: -1 })
    .lean();

  let entitlement = await getEntitlementByUserId(userId);

  if (paidOrders.length > 0 && !entitlementGrantsAccess(entitlement)) {
    const latest = paidOrders[0];
    entitlement = await activateEntitlementFromPayment(userId, latest.plan, {
      paymentOrderId: latest._id,
      paymentId: latest.razorpayPaymentId,
      event: 'restore_purchases',
    });
  }

  entitlement = await getEntitlementByUserId(userId);
  const user = await syncUserPremiumFields(userId);

  return {
    entitlement: formatEntitlementDto(entitlement),
    user,
    restoredOrders: paidOrders.length,
  };
}

export async function listPaymentHistory(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });

  const [orders, total] = await Promise.all([
    PaymentOrder.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('plan amountPaise currency status razorpayOrderId razorpayPaymentId createdAt updatedAt')
      .lean(),
    PaymentOrder.countDocuments({ userId }),
  ]);

  const items = orders.map((order) => ({
    id: order._id,
    plan: order.plan,
    amountPaise: order.amountPaise,
    currency: order.currency,
    status: order.status,
    orderId: order.razorpayOrderId,
    paymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  return buildPaginatedResult({ items, total, limit, offset });
}

export { ENTITLEMENT_STATUSES, ENTITLEMENT_PLANS };

import { PaymentOrder } from '../../models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../../models/SubscriptionEntitlement.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { getPlan } from '../../config/premiumPlans.js';
import { entitlementGrantsAccess } from '../entitlementService.js';
import { createNotification } from '../notificationService.js';
import { adminRefundPaymentOrder } from '../razorpayService.js';

function monthlyEquivalentPaise(plan) {
  if (plan === 'yearly') {
    return Math.round(getPlan('yearly').amountPaise / 12);
  }
  if (plan === 'monthly') {
    return getPlan('monthly').amountPaise;
  }
  return 0;
}

function formatTransaction(order) {
  const user = order.userId;
  const student =
    user && typeof user === 'object'
      ? {
          id: user._id?.toString?.() ?? user.id ?? null,
          name: user.name ?? 'Student',
          email: user.email ?? null,
        }
      : { id: null, name: 'Student', email: null };

  return {
    id: order._id.toString(),
    student,
    studentName: student.name,
    studentEmail: student.email,
    plan: order.plan,
    amountPaise: order.amountPaise,
    originalAmountPaise: order.originalAmountPaise ?? null,
    discountPaise: order.discountPaise ?? 0,
    couponCode: order.couponCode ?? null,
    currency: order.currency ?? 'INR',
    status: order.status,
    paymentId: order.razorpayPaymentId ?? null,
    orderId: order.razorpayOrderId,
    receipt: order.receipt,
    canRefund: order.status === 'paid' && Boolean(order.razorpayPaymentId),
    canRemind: order.status === 'created' || order.status === 'failed',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function getRevenueSummary() {
  const since30d = subtractDays(new Date(), 30);
  const now = new Date();

  const [entitlements, paidOrders30d, refunds30d, proStudents] = await Promise.all([
    SubscriptionEntitlement.find({
      plan: { $in: ['monthly', 'yearly'] },
      status: { $in: ['active', 'trialing', 'past_due', 'cancelled'] },
    }).lean(),
    PaymentOrder.find({ status: 'paid', createdAt: { $gte: since30d } }).lean(),
    PaymentOrder.countDocuments({ status: 'refunded', updatedAt: { $gte: since30d } }),
    SubscriptionEntitlement.countDocuments({
      plan: { $in: ['monthly', 'yearly'] },
      status: { $in: ['active', 'trialing', 'past_due', 'cancelled'] },
      currentPeriodEnd: { $gt: now },
    }),
  ]);

  const activePayingEntitlements = entitlements.filter((row) => entitlementGrantsAccess(row, now));

  const mrrPaise = activePayingEntitlements.reduce(
    (sum, row) => sum + monthlyEquivalentPaise(row.plan),
    0,
  );
  const revenue30dPaise = paidOrders30d.reduce((sum, row) => sum + row.amountPaise, 0);
  const activeSubscriptions = activePayingEntitlements.length;
  const arpuPaise =
    activeSubscriptions > 0
      ? Math.round(mrrPaise / activeSubscriptions)
      : getPlan('monthly').amountPaise;

  return {
    mrr: mrrPaise,
    activeSubs: activeSubscriptions,
    arpu: arpuPaise,
    refunds30d,
    mrrPaise,
    revenue30dPaise,
    activeSubscriptions,
    arpuPaise,
    proStudents,
  };
}

export async function listTransactions(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 25, maxLimit: 100 });

  const [orders, total] = await Promise.all([
    PaymentOrder.find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    PaymentOrder.countDocuments({}),
  ]);

  return buildPaginatedResult({
    items: orders.map(formatTransaction),
    total,
    limit,
    offset,
  });
}

export async function refundTransaction(orderId) {
  const order = await PaymentOrder.findById(orderId);

  if (!order) {
    throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  }

  if (order.status !== 'paid') {
    if (order.status === 'refunded') {
      const refreshed = await PaymentOrder.findById(orderId).populate('userId', 'name email').lean();
      return {
        refunded: true,
        duplicate: true,
        refundId: null,
        transaction: formatTransaction(refreshed),
      };
    }

    throw new AppError('Only paid transactions can be refunded', 400, 'NOT_REFUNDABLE');
  }

  if (!order.razorpayPaymentId) {
    throw new AppError('Payment id missing for this transaction', 400, 'MISSING_PAYMENT_ID');
  }

  const result = await adminRefundPaymentOrder(order);

  const refreshed = await PaymentOrder.findById(orderId).populate('userId', 'name email').lean();

  return {
    refunded: true,
    duplicate: Boolean(result.duplicate),
    refundId: result.refundId,
    transaction: formatTransaction(refreshed),
  };
}

export async function remindTransaction(orderId) {
  const order = await PaymentOrder.findById(orderId).populate('userId', 'name email');

  if (!order) {
    throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  }

  if (order.status === 'paid' || order.status === 'refunded') {
    throw new AppError('Completed transactions cannot be reminded', 400, 'NOT_REMINDABLE');
  }

  const planLabel = order.plan === 'yearly' ? 'Yearly Pro' : 'Monthly Pro';

  await createNotification(order.userId._id ?? order.userId, {
    type: 'payment_reminder',
    title: 'Complete your Sopaan Pro purchase',
    body: `Your ${planLabel} checkout is still pending. Open Premium to finish payment.`,
    data: {
      plan: order.plan,
      paymentOrderId: order._id.toString(),
      screen: 'Premium',
      params: { plan: order.plan },
    },
  });

  return {
    reminded: true,
    transactionId: order._id.toString(),
    studentName: order.userId?.name ?? 'Student',
  };
}

/** @deprecated use listTransactions */
export async function listRecentPayments(query = {}) {
  return listTransactions(query);
}

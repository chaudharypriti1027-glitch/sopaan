import { PaymentOrder } from '../../models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../../models/SubscriptionEntitlement.js';
import { User } from '../../models/User.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { getPlan } from '../../config/premiumPlans.js';

function monthlyEquivalentPaise(plan) {
  if (plan === 'yearly') {
    return Math.round(getPlan('yearly').amountPaise / 12);
  }
  return getPlan('monthly').amountPaise;
}

export async function getRevenueSummary() {
  const since30d = subtractDays(new Date(), 30);

  const [activeEntitlements, paidOrders30d, refunds30d, proStudents] = await Promise.all([
    SubscriptionEntitlement.find({ status: { $in: ['active', 'trialing'] } }).lean(),
    PaymentOrder.find({ status: 'paid', createdAt: { $gte: since30d } }).lean(),
    PaymentOrder.countDocuments({ status: 'refunded', updatedAt: { $gte: since30d } }),
    User.countDocuments({ role: 'student', isPremium: true }),
  ]);

  const mrrPaise = activeEntitlements.reduce(
    (sum, row) => sum + monthlyEquivalentPaise(row.plan),
    0,
  );
  const revenue30dPaise = paidOrders30d.reduce((sum, row) => sum + row.amountPaise, 0);
  const activeSubscriptions = activeEntitlements.length;
  const arpuPaise =
    activeSubscriptions > 0 ? Math.round(mrrPaise / activeSubscriptions) : getPlan('monthly').amountPaise;

  return {
    mrrPaise,
    revenue30dPaise,
    activeSubscriptions,
    proStudents,
    arpuPaise,
    refunds30d,
  };
}

export async function listRecentPayments(query = {}) {
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

  const items = orders.map((order) => ({
    id: order._id.toString(),
    studentName: order.userId?.name ?? 'Student',
    studentEmail: order.userId?.email ?? null,
    plan: order.plan,
    amountPaise: order.amountPaise,
    currency: order.currency ?? 'INR',
    status: order.status,
    paymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
  }));

  return buildPaginatedResult({ items, total, limit, offset });
}

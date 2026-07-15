import { listPublicPlans } from '../config/premiumPlans.js';
import * as razorpayService from '../services/razorpayService.js';
import * as premiumService from '../services/premiumService.js';
import {
  cancelEntitlement,
  formatEntitlementDto,
  getEntitlementByUserId,
  listPaymentHistory,
  restoreEntitlementsForUser,
  syncUserPremiumFields,
} from '../services/entitlementService.js';
import { AppError } from '../utils/AppError.js';

function toIsoOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatUser(user) {
  return {
    id: user._id ?? user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isPremium: user.isPremium,
    premiumPlan: user.premiumPlan ?? null,
    premiumExpiresAt: toIsoOrNull(user.premiumExpiresAt),
    premiumTrialUsed: Boolean(user.premiumTrialUsed),
    coins: user.coins,
    streak: user.streak,
  };
}

export async function listPlans(_req, res) {
  const configured = Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );

  res.status(200).json({
    provider: 'razorpay',
    currency: 'INR',
    configured,
    plans: listPublicPlans(),
  });
}

export async function createOrder(req, res) {
  const result = await razorpayService.createRazorpayOrder(req.user._id, req.body.plan);
  res.status(201).json(result);
}

export async function verifyPayment(req, res) {
  const result = await razorpayService.verifyAndActivatePremium(
    req.user._id,
    req.user.name,
    req.body,
  );
  res.status(200).json({
    success: true,
    verified: result.verified,
    active: result.active,
    pending: result.pending ?? false,
    user: result.user,
    plan: result.plan,
    paymentId: result.paymentId,
    message: result.message,
    alreadyFulfilled: result.alreadyFulfilled ?? false,
  });
}

export async function startTrial(req, res) {
  const result = await premiumService.startFreeTrial(req.user._id);

  if (result?.error === 'WELCOME_OFFER_DISABLED') {
    throw new AppError('Welcome free month offer is not available', 400, 'WELCOME_OFFER_DISABLED');
  }

  if (result?.error === 'TRIAL_ALREADY_USED') {
    throw new AppError('Free trial already used', 400, 'TRIAL_ALREADY_USED');
  }

  if (result?.error === 'ALREADY_PREMIUM') {
    throw new AppError('You already have Sopaan Pro', 400, 'ALREADY_PREMIUM');
  }

  res.status(200).json({
    success: true,
    user: formatUser(result.user),
  });
}

/** E2E-only: activate a paid plan without Razorpay (CI sandbox). */
export async function e2eSandboxActivate(req, res) {
  const { e2eConfig } = await import('../config/e2eConfig.js');

  if (!e2eConfig.sandboxPayments) {
    throw new AppError('Not found', 404, 'NOT_FOUND');
  }

  const user = await premiumService.activatePremium(req.user._id, req.body.plan);
  res.status(200).json({
    success: true,
    user: formatUser(user),
    plan: req.body.plan,
    sandbox: true,
  });
}

export async function getEntitlement(req, res) {
  await syncUserPremiumFields(req.user._id);
  const entitlement = await getEntitlementByUserId(req.user._id);
  const history = await listPaymentHistory(req.user._id, req.query);

  res.status(200).json({
    entitlement: formatEntitlementDto(entitlement),
    history,
  });
}

export async function restorePurchases(req, res) {
  const result = await restoreEntitlementsForUser(req.user._id);

  res.status(200).json({
    success: true,
    restored: result.restoredOrders > 0,
    entitlement: result.entitlement,
    user: formatUser(result.user),
  });
}

export async function cancelSubscription(req, res) {
  const entitlement = await cancelEntitlement(req.user._id, {
    atPeriodEnd: req.body?.atPeriodEnd !== false,
  });

  if (!entitlement) {
    throw new AppError('No active subscription found', 404, 'NO_SUBSCRIPTION');
  }

  const user = await syncUserPremiumFields(req.user._id);

  res.status(200).json({
    success: true,
    entitlement: formatEntitlementDto(entitlement),
    user: formatUser(user),
  });
}

export async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature || typeof signature !== 'string') {
    throw new AppError('Missing webhook signature', 400, 'MISSING_SIGNATURE');
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}));

  const result = await razorpayService.handleRazorpayWebhook(rawBody, signature);
  res.status(200).json(result);
}

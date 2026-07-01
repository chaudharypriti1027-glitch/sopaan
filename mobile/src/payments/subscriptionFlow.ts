import type { CreateOrderResponse, PremiumPlanId, RestorePurchasesResponse } from '../api/payments';
import type { User } from '../api/types';
import { paymentsApi } from '../api';
import { config } from '../config/env';

export type SubscriptionPlan = PremiumPlanId;

export type CheckoutPrefill = {
  name?: string;
  email?: string | null;
  contact?: string | null;
};

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayModule = {
  open: (options: Record<string, unknown>) => Promise<RazorpaySuccessPayload>;
};

const ENTITLEMENT_POLL_MS = 1000;
const ENTITLEMENT_POLL_ATTEMPTS = 20;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForEntitlementActivation(): Promise<User | null> {
  for (let attempt = 0; attempt < ENTITLEMENT_POLL_ATTEMPTS; attempt += 1) {
    const { entitlement } = await paymentsApi.getEntitlement();
    if (entitlement?.hasAccess) {
      const restore = await paymentsApi.restorePurchases();
      return restore.user;
    }
    await sleep(ENTITLEMENT_POLL_MS);
  }
  return null;
}

function loadRazorpayCheckout(): RazorpayModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('react-native-razorpay') as { default: RazorpayModule };
    return module.default;
  } catch {
    throw new Error(
      'Razorpay checkout requires a native build (expo run:android / expo run:ios). It is not available in Expo Go.',
    );
  }
}

export async function openRazorpayCheckout(
  order: CreateOrderResponse,
  prefill?: CheckoutPrefill,
): Promise<RazorpaySuccessPayload> {
  const RazorpayCheckout = loadRazorpayCheckout();

  return RazorpayCheckout.open({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'Sopaan',
    description: `Sopaan Pro · ${order.plan}`,
    prefill: {
      name: prefill?.name,
      email: prefill?.email ?? undefined,
      contact: prefill?.contact ?? undefined,
    },
    theme: { color: '#232A4D' },
  });
}

export async function checkoutPremiumPlan(
  plan: SubscriptionPlan,
  prefill?: CheckoutPrefill,
): Promise<{ user: User; plan: SubscriptionPlan }> {
  if (config.e2eSandbox) {
    const verified = await paymentsApi.e2eSandboxActivatePlan(plan);
    return { user: verified.user, plan: verified.plan };
  }

  const order = await paymentsApi.createOrder(plan);
  const payment = await openRazorpayCheckout(order, prefill);
  const verified = await paymentsApi.verifyPayment({
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
  });

  if (verified.active && verified.user.isPremium) {
    return { user: verified.user, plan: verified.plan };
  }

  const activatedUser = await waitForEntitlementActivation();
  if (activatedUser) {
    return { user: activatedUser, plan: verified.plan };
  }

  throw new Error(
    verified.message ??
      'Payment received. Pro access is still activating — pull to refresh or try Restore purchases in a moment.',
  );
}

export async function startFreeTrial(): Promise<Awaited<ReturnType<typeof paymentsApi.startFreeTrial>>['user']> {
  const result = await paymentsApi.startFreeTrial();
  return result.user;
}

export async function restorePurchases(): Promise<RestorePurchasesResponse> {
  return paymentsApi.restorePurchases();
}

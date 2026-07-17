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

/** User closed the Razorpay sheet — not an error, show nothing. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment cancelled by user');
    this.name = 'PaymentCancelledError';
  }
}

/** Checkout SDK is unavailable (Expo Go / web preview builds). */
export class CheckoutUnavailableError extends Error {
  constructor() {
    super('Razorpay checkout is not available in this build');
    this.name = 'CheckoutUnavailableError';
  }
}

const ENTITLEMENT_POLL_MS = 1000;
const ENTITLEMENT_POLL_ATTEMPTS = 20;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * react-native-razorpay rejects with `{ code, description }` (no `message`).
 * Cancellation surfaces as code 0/2 or a description containing "cancel".
 */
function isCheckoutCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const raw = error as { code?: unknown; description?: unknown; message?: unknown };
  const text = `${String(raw.description ?? '')} ${String(raw.message ?? '')}`;
  if (/cancel/i.test(text)) {
    return true;
  }
  return raw.code === 0 || raw.code === 2 || raw.code === '0' || raw.code === '2';
}

function checkoutErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const raw = error as { description?: unknown; message?: unknown };
    const description = typeof raw.description === 'string' ? raw.description : '';
    // Razorpay sometimes packs a JSON blob into description — extract the readable part.
    if (description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(description) as {
          error?: { description?: string; reason?: string };
        };
        const inner = parsed.error?.description ?? parsed.error?.reason;
        if (inner) {
          return inner;
        }
      } catch {
        // fall through to raw description
      }
    }
    if (description) {
      return description;
    }
    if (typeof raw.message === 'string' && raw.message) {
      return raw.message;
    }
  }
  return 'Payment could not be completed. You have not been charged — please try again.';
}

async function waitForEntitlementActivation(): Promise<User | null> {
  for (let attempt = 0; attempt < ENTITLEMENT_POLL_ATTEMPTS; attempt += 1) {
    try {
      const { entitlement } = await paymentsApi.getEntitlement();
      if (entitlement?.hasAccess) {
        const restore = await paymentsApi.restorePurchases();
        return restore.user;
      }
    } catch {
      // Transient poll failure — keep waiting; webhook fulfillment continues server-side.
    }
    await sleep(ENTITLEMENT_POLL_MS);
  }
  return null;
}

function loadRazorpayCheckout(): RazorpayModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('react-native-razorpay') as { default: RazorpayModule };
    if (!module?.default?.open) {
      throw new Error('missing native module');
    }
    return module.default;
  } catch {
    throw new CheckoutUnavailableError();
  }
}

export async function openRazorpayCheckout(
  order: CreateOrderResponse,
  prefill?: CheckoutPrefill,
): Promise<RazorpaySuccessPayload> {
  const RazorpayCheckout = loadRazorpayCheckout();

  try {
    return await RazorpayCheckout.open({
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
      theme: { color: '#1C2450' },
    });
  } catch (error) {
    if (isCheckoutCancellation(error)) {
      throw new PaymentCancelledError();
    }
    throw new Error(checkoutErrorMessage(error));
  }
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

  // Money has been taken at this point. If the verify request fails (network
  // blip, server restart), fall back to entitlement polling — the Razorpay
  // webhook fulfills the order server-side independently of this call.
  let verified: Awaited<ReturnType<typeof paymentsApi.verifyPayment>> | null = null;
  try {
    verified = await paymentsApi.verifyPayment({
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    });
  } catch {
    verified = null;
  }

  if (verified?.active && verified.user.isPremium) {
    return { user: verified.user, plan: verified.plan };
  }

  const activatedUser = await waitForEntitlementActivation();
  if (activatedUser) {
    return { user: activatedUser, plan: verified?.plan ?? plan };
  }

  throw new Error(
    verified?.message ??
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

import { apiClient } from './client';
import type { User } from './types';

export type PremiumPlanId = 'monthly' | 'yearly';

export type PremiumPlan = {
  id: PremiumPlanId;
  label: string;
  amountPaise: number;
  displayAmount: string;
  interval: string;
  description: string;
};

export type PremiumPlansResponse = {
  provider: string;
  currency: string;
  /** False when Razorpay keys are unset — checkout is unavailable. */
  configured?: boolean;
  plans: PremiumPlan[];
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: PremiumPlanId;
  displayAmount: string;
  receipt: string;
};

export type VerifyPaymentInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  verified?: boolean;
  active?: boolean;
  pending?: boolean;
  message?: string;
  paymentId?: string;
  user: User;
  plan: PremiumPlanId;
  alreadyFulfilled?: boolean;
};

export type EntitlementStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type EntitlementPlan = 'monthly' | 'yearly' | 'trial';

export type SubscriptionEntitlement = {
  id: string;
  plan: EntitlementPlan;
  status: EntitlementStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  provider: 'razorpay';
  providerSubscriptionId?: string | null;
  autoRenews: boolean;
  hasAccess: boolean;
  updatedAt: string;
};

export type PaymentHistoryItem = {
  id: string;
  plan: PremiumPlanId;
  amountPaise: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  orderId: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EntitlementResponse = {
  entitlement: SubscriptionEntitlement | null;
  history: PaymentHistoryItem[];
};

export type RestorePurchasesResponse = {
  success: boolean;
  restored: boolean;
  entitlement: SubscriptionEntitlement | null;
  user: User;
};

export async function listPlans(): Promise<PremiumPlansResponse> {
  const { data } = await apiClient.get<PremiumPlansResponse>('/payments/plans');
  return data;
}

export async function createOrder(plan: PremiumPlanId): Promise<CreateOrderResponse> {
  const { data } = await apiClient.post<CreateOrderResponse>('/payments/create-order', { plan });
  return data;
}

export async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
  const { data } = await apiClient.post<VerifyPaymentResponse>('/payments/verify', input);
  return data;
}

export async function startFreeTrial(): Promise<{ success: boolean; user: User }> {
  const { data } = await apiClient.post<{ success: boolean; user: User }>('/payments/start-trial');
  return data;
}

export async function e2eSandboxActivatePlan(plan: PremiumPlanId): Promise<VerifyPaymentResponse> {
  const { data } = await apiClient.post<VerifyPaymentResponse>('/payments/e2e/activate-plan', { plan });
  return data;
}

export async function getEntitlement(): Promise<EntitlementResponse> {
  const { data } = await apiClient.get<EntitlementResponse>('/payments/entitlement');
  return data;
}

export async function restorePurchases(): Promise<RestorePurchasesResponse> {
  const { data } = await apiClient.post<RestorePurchasesResponse>('/payments/restore');
  return data;
}

export async function cancelSubscription(input?: {
  atPeriodEnd?: boolean;
}): Promise<{ success: boolean; entitlement: SubscriptionEntitlement | null; user: User }> {
  const { data } = await apiClient.post('/payments/cancel', input ?? { atPeriodEnd: true });
  return data;
}

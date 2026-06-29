/**
 * Sopaan Pro pricing — amounts are authoritative server-side values (INR paise).
 * Never accept amounts from the client.
 */
export const PREMIUM_PLANS = Object.freeze({
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    amountPaise: Number(process.env.PREMIUM_MONTHLY_AMOUNT_PAISE ?? 29900),
    interval: 'month',
    displayAmount: '₹299',
    description: 'Billed every month',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    amountPaise: Number(process.env.PREMIUM_YEARLY_AMOUNT_PAISE ?? 249900),
    interval: 'year',
    displayAmount: '₹2,499',
    description: 'Save ~30% vs monthly',
  },
});

export function getPlan(planId) {
  const plan = PREMIUM_PLANS[planId];
  if (!plan) {
    return null;
  }
  return plan;
}

export function listPublicPlans() {
  return Object.values(PREMIUM_PLANS).map((plan) => ({
    id: plan.id,
    label: plan.label,
    amountPaise: plan.amountPaise,
    displayAmount: plan.displayAmount,
    interval: plan.interval,
    description: plan.description,
  }));
}

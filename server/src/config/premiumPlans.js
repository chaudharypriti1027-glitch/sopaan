import {
  buildPremiumPlansFromSettings,
  getSettingsSnapshot,
} from '../services/platformSettingsService.js';

/**
 * Sopaan Pro pricing — amounts are authoritative server-side values (INR paise).
 * Never accept amounts from the client.
 */
export function getPlan(planId) {
  const plans = buildPremiumPlansFromSettings(getSettingsSnapshot());
  return plans[planId] ?? null;
}

export function listPublicPlans() {
  return Object.values(buildPremiumPlansFromSettings(getSettingsSnapshot())).map((plan) => ({
    id: plan.id,
    label: plan.label,
    amountPaise: plan.amountPaise,
    displayAmount: plan.displayAmount,
    interval: plan.interval,
    description: plan.description,
  }));
}

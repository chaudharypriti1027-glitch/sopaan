import { User } from '../models/User.js';
import {
  activateEntitlementFromPayment,
  activateTrialEntitlement,
  extendEntitlementPeriod,
  getEntitlementByUserId,
  reconcileEntitlementExpiry,
  syncUserPremiumFields,
  entitlementGrantsAccess,
} from './entitlementService.js';

export function computePremiumExpiry(plan, fromDate = new Date()) {
  const expires = new Date(fromDate);

  if (plan === 'monthly') {
    expires.setMonth(expires.getMonth() + 1);
  } else if (plan === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else if (plan === 'trial') {
    expires.setDate(expires.getDate() + 7);
  }

  return expires;
}

export async function isPremiumActive(user) {
  if (!user?._id) {
    return false;
  }

  const entitlement = await reconcileEntitlementExpiry(
    await getEntitlementByUserId(user._id),
  );

  if (entitlement) {
    return entitlementGrantsAccess(entitlement);
  }

  if (!user.isPremium) {
    return false;
  }

  if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
    await User.findByIdAndUpdate(user._id, {
      isPremium: false,
      premiumPlan: null,
    });
    return false;
  }

  return true;
}

export async function activatePremium(userId, plan) {
  await activateEntitlementFromPayment(userId, plan, { event: 'client_verify' });
  return User.findById(userId);
}

export async function startFreeTrial(userId) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  if (user.premiumTrialUsed) {
    return { error: 'TRIAL_ALREADY_USED' };
  }

  const entitlement = await getEntitlementByUserId(userId);
  if (entitlementGrantsAccess(entitlement)) {
    return { error: 'ALREADY_PREMIUM' };
  }

  await activateTrialEntitlement(userId);
  user.isPremium = true;
  user.premiumPlan = 'trial';
  user.premiumExpiresAt = computePremiumExpiry('trial');
  user.premiumTrialUsed = true;
  await user.save();

  const { trackTrialStart } = await import('./experimentService.js');
  trackTrialStart(userId).catch((err) => {
    console.warn(`[experiments] trial_start track failed for ${userId}:`, err.message);
  });

  return { user: await syncUserPremiumFields(userId) };
}

export async function grantReferralTrialDays(userId, days) {
  if (!days || days <= 0) {
    return { granted: false };
  }

  const user = await User.findById(userId);

  if (!user) {
    return { granted: false };
  }

  const entitlement = await getEntitlementByUserId(userId);

  if (!entitlementGrantsAccess(entitlement) && !user.premiumTrialUsed) {
    await activateTrialEntitlement(userId);
    if (days > 7) {
      await extendEntitlementPeriod(userId, 'trial', days - 7);
    }
    user.premiumTrialUsed = true;
    await user.save();
    const synced = await syncUserPremiumFields(userId);
    return { granted: true, mode: 'trial_started', expiresAt: synced?.premiumExpiresAt };
  }

  if (entitlementGrantsAccess(entitlement)) {
    const extended = await extendEntitlementPeriod(
      userId,
      entitlement?.plan ?? 'trial',
      days,
    );
    return { granted: true, mode: 'extended', expiresAt: extended?.currentPeriodEnd };
  }

  return { granted: false, mode: 'skipped' };
}

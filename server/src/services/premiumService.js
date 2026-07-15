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
import { SubscriptionEntitlement } from '../models/SubscriptionEntitlement.js';
import { getSettingsSnapshot } from './platformSettingsService.js';

/** Welcome / free-trial length for new students (first app launch offer). */
export const WELCOME_MONTH_DAYS = 30;

export function isWelcomeMonthOfferEnabled(settings = getSettingsSnapshot()) {
  return settings?.welcomeMonthEnabled !== false;
}

export function computePremiumExpiry(plan, fromDate = new Date()) {
  const expires = new Date(fromDate);

  if (plan === 'monthly') {
    expires.setMonth(expires.getMonth() + 1);
  } else if (plan === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else if (plan === 'trial') {
    // 1 month free Pro for new students (launch welcome offer).
    expires.setMonth(expires.getMonth() + 1);
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
      premiumExpiresAt: null,
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

  if (!isWelcomeMonthOfferEnabled()) {
    return { error: 'WELCOME_OFFER_DISABLED' };
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

/**
 * One-time 1-month Pro grant for brand-new students (server-side, once per user).
 * Safe to call from signup paths — no-ops if offer disabled, trial used, or already Pro.
 */
export async function grantWelcomeMonthForNewStudent(userId) {
  const result = await startFreeTrial(userId);
  if (!result || result.error) {
    return { granted: false, reason: result?.error ?? 'USER_NOT_FOUND' };
  }
  return { granted: true, user: result.user };
}

/**
 * Admin: revoke active free/welcome/trial Pro entitlements only (never paid monthly/yearly).
 */
export async function revokeAllWelcomeMonthEntitlements() {
  const revocableStatuses = ['trialing', 'active', 'past_due', 'cancelled'];
  const activeTrials = await SubscriptionEntitlement.find({
    plan: 'trial',
    status: { $in: revocableStatuses },
  }).select('_id userId status');

  let revoked = 0;
  for (const row of activeTrials) {
    // Re-check plan and status atomically so a concurrent paid activation can
    // never be overwritten by this bulk trial revocation.
    const result = await SubscriptionEntitlement.updateOne(
      {
        _id: row._id,
        userId: row.userId,
        plan: 'trial',
        status: { $in: revocableStatuses },
      },
      {
        $set: {
          status: 'expired',
          'metadata.lastEvent': 'admin_welcome_month_revoked',
        },
      },
    );
    if (result.modifiedCount > 0) {
      await syncUserPremiumFields(row.userId);
      revoked += 1;
    }
  }

  // Safety net: users marked trial on User without an entitlement row.
  // Exclude anyone with a currently accessible paid entitlement, even if the
  // denormalized User fields are stale.
  const paidUserIds = await SubscriptionEntitlement.distinct('userId', {
    plan: { $in: ['monthly', 'yearly'] },
    status: { $in: revocableStatuses },
    currentPeriodEnd: { $gt: new Date() },
  });
  const stalePaidUsers = await User.find({
    _id: { $in: paidUserIds },
    premiumPlan: 'trial',
  }).select('_id');
  await Promise.all(stalePaidUsers.map((user) => syncUserPremiumFields(user._id)));

  const orphanUsers = await User.updateMany(
    {
      _id: { $nin: paidUserIds },
      premiumPlan: 'trial',
      isPremium: true,
    },
    {
      $set: {
        isPremium: false,
        premiumPlan: null,
        premiumExpiresAt: null,
      },
    },
  );

  return {
    revoked,
    orphanUsersCleared: orphanUsers.modifiedCount ?? 0,
    paidUsersProtected: stalePaidUsers.length,
    welcomeMonthEnabled: isWelcomeMonthOfferEnabled(),
  };
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
    if (!isWelcomeMonthOfferEnabled()) {
      return { granted: false, mode: 'offer_disabled' };
    }
    await activateTrialEntitlement(userId);
    if (days > WELCOME_MONTH_DAYS) {
      await extendEntitlementPeriod(userId, 'trial', days - WELCOME_MONTH_DAYS);
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

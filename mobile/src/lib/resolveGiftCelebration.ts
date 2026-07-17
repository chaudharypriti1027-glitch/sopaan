import type { SubscriptionEntitlement } from '../api/payments';

export type GiftCelebrationTarget = {
  entitlementId: string;
  grantedAt: string;
};

/**
 * Resolve whether entitlement should trigger the Sopaan gift Pro popup.
 * Accepts provider=admin even when older payloads omit isGift / giftGrantedAt.
 */
export function resolveGiftCelebrationTarget(
  entitlement: SubscriptionEntitlement | null | undefined,
): GiftCelebrationTarget | null {
  if (!entitlement?.hasAccess || !entitlement.id) {
    return null;
  }

  const isGift = entitlement.isGift === true || entitlement.provider === 'admin';
  if (!isGift) {
    return null;
  }

  const grantedAt =
    entitlement.giftGrantedAt?.trim() ||
    entitlement.updatedAt?.trim() ||
    entitlement.currentPeriodStart?.trim() ||
    '';

  if (!grantedAt) {
    return null;
  }

  return {
    entitlementId: String(entitlement.id),
    grantedAt,
  };
}

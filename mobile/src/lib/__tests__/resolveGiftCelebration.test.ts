import { describe, expect, it } from '@jest/globals';
import type { SubscriptionEntitlement } from '../../api/payments';
import { resolveGiftCelebrationTarget } from '../resolveGiftCelebration';

function baseEntitlement(
  overrides: Partial<SubscriptionEntitlement> = {},
): SubscriptionEntitlement {
  return {
    id: 'ent-1',
    plan: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-07-01T00:00:00.000Z',
    currentPeriodEnd: '2026-08-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    provider: 'admin',
    autoRenews: false,
    hasAccess: true,
    isGift: true,
    giftGrantedAt: '2026-07-17T10:00:00.000Z',
    updatedAt: '2026-07-17T10:00:00.000Z',
    ...overrides,
  };
}

describe('resolveGiftCelebrationTarget', () => {
  it('returns a target for admin gift entitlements', () => {
    expect(resolveGiftCelebrationTarget(baseEntitlement())).toEqual({
      entitlementId: 'ent-1',
      grantedAt: '2026-07-17T10:00:00.000Z',
    });
  });

  it('treats provider=admin as a gift even without isGift', () => {
    const target = resolveGiftCelebrationTarget(
      baseEntitlement({ isGift: undefined, giftGrantedAt: null, provider: 'admin' }),
    );
    expect(target?.entitlementId).toBe('ent-1');
    expect(target?.grantedAt).toBe('2026-07-17T10:00:00.000Z');
  });

  it('ignores paid razorpay entitlements', () => {
    expect(
      resolveGiftCelebrationTarget(
        baseEntitlement({ provider: 'razorpay', isGift: false, giftGrantedAt: null }),
      ),
    ).toBeNull();
  });

  it('ignores gifts without access', () => {
    expect(resolveGiftCelebrationTarget(baseEntitlement({ hasAccess: false }))).toBeNull();
  });
});

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { paymentsApi } from '../../api';
import { useAuth } from '../../auth';
import { queryKeys } from '../../hooks/queryKeys';
import {
  giftProCelebrationKey,
  hasSeenGiftProCelebration,
  markGiftProCelebrationSeen,
} from '../../lib/giftProStorage';
import { resolveGiftCelebrationTarget } from '../../lib/resolveGiftCelebration';
import { useFormat } from '../../i18n/useFormat';
import { GiftSubscriptionDialog } from './GiftSubscriptionDialog';

function navigateToPremium() {
  const { navigationRef } =
    require('../../navigation/navigationRef') as typeof import('../../navigation/navigationRef');
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: { screen: 'Premium' },
    }),
  );
}

/**
 * Shows a one-time Sopaan gift celebration when admin grants complimentary Pro.
 * Mounted globally so it appears on Home / any tab after a grant.
 */
export function GiftProHost() {
  const { t } = useTranslation('app');
  const { formatDate, parseDate } = useFormat();
  const { profile, user, isAuthenticated, refreshUser } = useAuth();

  const [visible, setVisible] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState<string | null>(null);
  const showingRef = useRef(false);

  const entitlementQuery = useQuery({
    queryKey: queryKeys.payments.entitlement(),
    queryFn: paymentsApi.getEntitlement,
    enabled: Boolean(isAuthenticated && user),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Catch admin gifts granted while the app stays open.
    refetchInterval: 15_000,
  });

  const entitlement = entitlementQuery.data?.entitlement;

  const evaluateGift = useCallback(async () => {
    const target = resolveGiftCelebrationTarget(entitlement);
    if (!target || showingRef.current) {
      return;
    }

    const key = giftProCelebrationKey(target.entitlementId, target.grantedAt);
    const seen = await hasSeenGiftProCelebration(key);
    if (seen) {
      return;
    }

    showingRef.current = true;
    setCelebrationKey(key);
    // Small delay so splash / tab transition doesn't eat the modal.
    setTimeout(() => setVisible(true), 350);
    void refreshUser().catch(() => undefined);
  }, [entitlement, refreshUser]);

  useEffect(() => {
    void evaluateGift();
  }, [evaluateGift]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void entitlementQuery.refetch().then(() => {
          void evaluateGift();
        });
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [entitlementQuery, evaluateGift]);

  const dismiss = useCallback(() => {
    setVisible(false);
    showingRef.current = false;
    if (celebrationKey) {
      void markGiftProCelebrationSeen(celebrationKey);
    }
  }, [celebrationKey]);

  const planLabel = useMemo(() => {
    if (!entitlement?.plan) {
      return t('premium.giftPlanFallback');
    }
    if (entitlement.status === 'trialing' || entitlement.plan === 'trial') {
      return t('premium.trialActive');
    }
    return t('premium.planSuffix', { plan: entitlement.plan });
  }, [entitlement?.plan, entitlement?.status, t]);

  const validUntilLabel = useMemo(() => {
    const raw = entitlement?.currentPeriodEnd;
    if (!raw || !parseDate(raw)) {
      return null;
    }
    return formatDate(raw, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [entitlement?.currentPeriodEnd, formatDate, parseDate]);

  const openPremium = useCallback(() => {
    dismiss();
    navigateToPremium();
  }, [dismiss]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <GiftSubscriptionDialog
      visible={visible}
      studentName={profile?.name ?? user?.name}
      planLabel={planLabel}
      validUntilLabel={validUntilLabel}
      onClose={dismiss}
      onExplore={openPremium}
    />
  );
}

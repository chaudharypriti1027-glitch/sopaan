import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { getTierStatus, type TierFeatureKey, type TierStatusResponse } from '../api/tier';
import { parseApiError, type ApiError } from '../api/errors';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';
import type { MainStackParamList } from '../navigation/types';

type ProNav = NativeStackNavigationProp<MainStackParamList>;

export type PaywallParams = {
  feature?: TierFeatureKey;
  paywallTitle?: string;
  paywallMessage?: string;
};

function isProGateError(error: ApiError): boolean {
  return (
    error.code === 'PRO_REQUIRED' ||
    error.code === 'PREMIUM_REQUIRED' ||
    error.code === 'QUOTA_EXCEEDED' ||
    error.code === 'AI_LIMIT_REACHED'
  );
}

export function useTierStatus(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.tier.status(),
    queryFn: getTierStatus,
    enabled: enabled && isAuthenticated,
    staleTime: 60_000,
  });
}

export function useProGate() {
  const navigation = useNavigation<ProNav>();
  const { user } = useAuth();
  const { t } = useTranslation('app');
  const tierQuery = useTierStatus();

  // Idle/loading/refetch: allow session premium so checkout unlocks immediately.
  // Settled success: trust server tier so expired cancel periods drop Pro correctly.
  const isPro =
    user?.role === 'admin' ||
    (tierQuery.isSuccess && !tierQuery.isFetching
      ? Boolean(tierQuery.data?.isPro)
      : Boolean(user?.isPremium) || Boolean(tierQuery.data?.isPro));
  const showAds = tierQuery.data?.showAds ?? !isPro;
  const tier = tierQuery.data;
  const tierPending = tierQuery.isLoading || (tierQuery.isFetching && !tierQuery.isSuccess);

  const getFeatureConfig = useCallback(
    (feature: TierFeatureKey) => tier?.features?.[feature] ?? null,
    [tier],
  );

  const openPaywall = useCallback(
    (params?: PaywallParams) => {
      const feature = params?.feature;
      const fromTier = feature ? getFeatureConfig(feature) : null;

      navigation.navigate('Premium', {
        feature,
        paywallTitle:
          params?.paywallTitle ?? fromTier?.title ?? t('premium.paywallDefaultTitle'),
        paywallMessage:
          params?.paywallMessage ??
          fromTier?.message ??
          t('premium.paywallDefaultMessage'),
      });
    },
    [navigation, getFeatureConfig, t],
  );

  const handleProError = useCallback(
    (error: unknown): boolean => {
      const parsed = parseApiError(error);
      if (!isProGateError(parsed)) {
        return false;
      }

      openPaywall({
        feature: parsed.details?.feature as TierFeatureKey | undefined,
        paywallTitle: parsed.details?.paywallTitle,
        paywallMessage: parsed.details?.paywallMessage ?? parsed.message,
      });
      return true;
    },
    [openPaywall],
  );

  const canUseFeature = useCallback(
    (feature: TierFeatureKey): boolean => {
      if (isPro) {
        return true;
      }

      const config = getFeatureConfig(feature);
      if (!config) {
        // Avoid premature paywalls before /tier/status lands.
        return tierPending;
      }

      if (config.type === 'pro_only') {
        return tier?.detailedAnalytics === true && feature === 'detailed_analytics';
      }

      if (!tier?.usage) {
        return true;
      }

      if (feature === 'ai_generate_test') {
        return tier.usage.remaining.aiGenerateTests > 0;
      }
      if (feature === 'mock_submit') {
        return tier.usage.remaining.mocksSubmitted > 0;
      }
      if (feature === 'ai_doubt') {
        return tier.usage.remaining.aiDoubtsFast > 0;
      }
      if (feature === 'ai_evaluate') {
        return (tier.usage.remaining.aiEvaluations ?? 0) > 0;
      }

      return false;
    },
    [isPro, getFeatureConfig, tier, tierPending],
  );

  const guardFeature = useCallback(
    (feature: TierFeatureKey, onAllowed: () => void) => {
      if (canUseFeature(feature)) {
        onAllowed();
        return;
      }

      openPaywall({ feature });
    },
    [canUseFeature, openPaywall],
  );

  return useMemo(
    () => ({
      isPro,
      showAds,
      tier: tier as TierStatusResponse | undefined,
      isLoading: tierQuery.isLoading,
      refetchTier: tierQuery.refetch,
      openPaywall,
      handleProError,
      canUseFeature,
      guardFeature,
    }),
    [
      isPro,
      showAds,
      tier,
      tierQuery.isLoading,
      tierQuery.refetch,
      openPaywall,
      handleProError,
      canUseFeature,
      guardFeature,
    ],
  );
}

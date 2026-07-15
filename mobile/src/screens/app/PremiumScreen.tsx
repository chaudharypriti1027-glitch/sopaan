import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';
import { Button, Card, FeatureScreenLayout, Pill, PremiumHeroCard } from '../../components';
import {
  PREMIUM,
  PremiumIcon,
  PremiumSectionLabel,
  SubscriptionSuccessDialog,
  usePremiumDialog,
} from '../../components/premium';
import type { SubscriptionSuccessDetail } from '../../components/premium';
import { useAuth } from '../../auth';
import { useExperiments } from '../../experiments';
import { usePremiumPlans, useProGate, useSubscriptionEntitlement } from '../../hooks';
import { invalidateSubscriptionCaches } from '../../hooks/usePayments';
import { useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '../../api';
import type { PremiumPlanId } from '../../api/payments';
import {
  checkoutPremiumPlan,
  startFreeTrial,
  type SubscriptionPlan,
} from '../../payments/subscriptionFlow';
import { Check, Crown, Gift, Zap } from 'lucide-react-native';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { INVALID_DATE_FALLBACK, parseDate } from '../../i18n/format';
import { useFormat } from '../../i18n/useFormat';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';

type PremiumNav = NativeStackNavigationProp<MainStackParamList, 'Premium'>;
type PremiumRoute = RouteProp<MainStackParamList, 'Premium'>;

type SuccessKind = 'purchase' | 'trial';

type SuccessState = {
  kind: SuccessKind;
  planLabel: string;
  amountLabel?: string;
  periodEnd?: string | null;
};

export function PremiumScreen() {
  const navigation = useNavigation<PremiumNav>();
  const route = useRoute<PremiumRoute>();
  const paywall = route.params;
  const { user, setSessionUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { payloads, trackEvent } = useExperiments();
  const copy = payloads.paywall_copy;
  const heroTitle = paywall?.paywallTitle ?? copy.heroTitle;
  const heroSub = paywall?.paywallMessage ?? copy.heroSub;
  const trackedView = useRef(false);
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const { alert } = usePremiumDialog();
  const { tier } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPremium = user?.isPremium;
  const plansQuery = usePremiumPlans();
  const entitlementQuery = useSubscriptionEntitlement(Boolean(isPremium));
  const welcomeOfferEnabled = tier?.welcomeMonthEnabled !== false;
  const canClaimWelcome =
    welcomeOfferEnabled && !isPremium && user?.premiumTrialUsed !== true;

  const [plan, setPlan] = useState<SubscriptionPlan>(
    paywall?.plan === 'monthly' || paywall?.plan === 'yearly' ? paywall.plan : 'yearly',
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const plans = plansQuery.data?.plans ?? [];
  const selectedPlan = plans.find((item) => item.id === plan);
  /** Explicit false from API — undefined means older/working servers still allow checkout. */
  const paymentsConfigured = plansQuery.data?.configured !== false;

  useEffect(() => {
    if (paywall?.plan === 'monthly' || paywall?.plan === 'yearly') {
      setPlan(paywall.plan);
    }
  }, [paywall?.plan]);

  useEffect(() => {
    if (isPremium || trackedView.current) {
      return;
    }

    trackedView.current = true;
    void trackEvent('paywall_view', { screen: 'Premium' });
  }, [isPremium, trackEvent]);

  const closeSuccess = () => setSuccess(null);

  const exploreAfterSuccess = () => {
    closeSuccess();
    navigation.navigate('AppTabs', { screen: 'Home' });
  };

  const successDetails = useMemo((): SubscriptionSuccessDetail[] => {
    if (!success) return [];
    const rows: SubscriptionSuccessDetail[] = [
      {
        label: t('premium.successDetailPlan'),
        value: success.planLabel,
      },
    ];
    if (success.amountLabel) {
      rows.push({
        label: t('premium.successDetailAmount'),
        value: success.amountLabel,
      });
    }
    rows.push({
      label: t('premium.successDetailStatus'),
      value:
        success.kind === 'trial'
          ? t('manageSubscription.statusTrialing')
          : t('manageSubscription.statusActive'),
    });
    if (success.periodEnd && parseDate(success.periodEnd)) {
      const validUntil = formatDate(success.periodEnd, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      if (validUntil !== INVALID_DATE_FALLBACK) {
        rows.push({
          label: t('premium.successDetailValidUntil'),
          value: validUntil,
        });
      }
    }
    return rows;
  }, [formatDate, success, t]);

  const handleSubscribe = async () => {
    if (!paymentsConfigured) {
      alert({
        title: t('premium.paymentsComingSoon'),
        message: t('premium.paymentsComingSoonBody'),
        icon: 'bell',
        iconTone: 'navy',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await checkoutPremiumPlan(plan, {
        name: user?.name,
        email: user?.email,
        contact: user?.phone,
      });
      setSessionUser(result.user);
      await refreshUser();
      invalidateSubscriptionCaches(queryClient);
      void entitlementQuery.refetch();
      setSuccess({
        kind: 'purchase',
        planLabel: selectedPlan?.label ?? result.plan,
        amountLabel: selectedPlan?.displayAmount,
        periodEnd: result.user.premiumExpiresAt,
      });
      void trackEvent('paywall_purchase_success', { plan: result.plan });
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.message?.toLowerCase().includes('cancelled')) {
        return;
      }
      if (parsed.code === 'PAYMENTS_NOT_CONFIGURED') {
        alert({
          title: t('premium.paymentsComingSoon'),
          message: t('premium.paymentsComingSoonBody'),
          icon: 'bell',
          iconTone: 'navy',
        });
        return;
      }
      alert({
        title: t('premium.paymentFailed'),
        message: getUserFacingMessage(error),
        icon: 'info',
        iconTone: 'coral',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrial = async () => {
    setLoading(true);
    try {
      const updatedUser = await startFreeTrial();
      setSessionUser(updatedUser);
      await refreshUser();
      invalidateSubscriptionCaches(queryClient);
      void entitlementQuery.refetch();
      setSuccess({
        kind: 'trial',
        planLabel: t('premium.trialPlanLabel'),
        periodEnd: updatedUser.premiumExpiresAt,
      });
      void trackEvent('paywall_trial_success', {});
    } catch (error) {
      alert({
        title: t('premium.trialFailedTitle'),
        message: getUserFacingMessage(error),
        icon: 'info',
        iconTone: 'coral',
      });
    } finally {
      setLoading(false);
    }
  };

  const heroIcon = (
    <PremiumIcon Icon={Crown} tone="gold" size="lg" filled surface="dark" />
  );
  const reduceMotion = useReducedMotion();
  const enter = (delay: number) =>
    reduceMotion
      ? undefined
      : FadeInDown.delay(delay).duration(400).reduceMotion(ReduceMotion.System);

  const successDialog = (
    <SubscriptionSuccessDialog
      visible={Boolean(success)}
      title={
        success?.kind === 'trial' ? t('premium.trialStartedTitle') : t('premium.welcomeTitle')
      }
      subtitle={
        success?.kind === 'trial' ? t('premium.trialStartedBody') : t('premium.welcomeBody')
      }
      details={successDetails}
      perkLabels={[
        t('premium.successPerkAi'),
        t('premium.successPerkMocks'),
        t('premium.successPerkAnalytics'),
      ]}
      primaryLabel={t('premium.successExplore')}
      secondaryLabel={t('premium.manage')}
      onPrimary={exploreAfterSuccess}
      onSecondary={() => {
        closeSuccess();
        navigation.navigate('ManageSubscription');
      }}
      onClose={closeSuccess}
    />
  );

  if (plansQuery.isLoading) {
    return (
      <FeatureScreenLayout
        title={t('premium.title')}
        subtitle={t('premium.subtitle')}
        contentStyle={styles.centered}
      >
        <ActivityIndicator size="large" color={PREMIUM.gold} />
      </FeatureScreenLayout>
    );
  }

  if (!isPremium && (plansQuery.isError || plans.length === 0)) {
    return (
      <FeatureScreenLayout
        title={t('premium.title')}
        subtitle={t('premium.subtitle')}
        contentStyle={styles.content}
      >
        <PremiumHeroCard
          icon={heroIcon}
          eyebrow={t('premium.goPremium')}
          title={t('premium.plansLoadError')}
          hint={
            plansQuery.isError ? t('premium.plansLoadErrorBody') : t('premium.plansEmpty')
          }
        />
        <Button
          label={t('premium.retryPlans')}
          variant="gold"
          fullWidth
          onPress={() => void plansQuery.refetch()}
        />
      </FeatureScreenLayout>
    );
  }

  if (isPremium) {
    const entitlement = entitlementQuery.data?.entitlement;
    const periodEndRaw =
      success?.periodEnd ?? entitlement?.currentPeriodEnd ?? user?.premiumExpiresAt;
    const periodEndLabel = parseDate(periodEndRaw)
      ? formatDate(periodEndRaw, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;
    const planLabel =
      entitlement?.status === 'trialing' || user?.premiumPlan === 'trial' || success?.kind === 'trial'
        ? t('premium.trialActive')
        : entitlement?.plan ?? user?.premiumPlan
          ? t('premium.planSuffix', { plan: entitlement?.plan ?? user?.premiumPlan })
          : t('premium.premiumActive');

    return (
      <FeatureScreenLayout
        title={t('premium.title')}
        subtitle={t('premium.proActive')}
        contentStyle={styles.content}
      >
        <PremiumHeroCard
          icon={heroIcon}
          eyebrow={t('premium.proActive')}
          title={planLabel}
          trailing={
            entitlement ? (
              <Pill
                label={
                  entitlement.status === 'cancelled'
                    ? t('premium.cancelsAtPeriodEnd')
                    : entitlement.status === 'trialing'
                      ? t('manageSubscription.statusTrialing')
                      : entitlement.status === 'past_due'
                        ? t('manageSubscription.statusPastDue')
                        : entitlement.status === 'expired'
                          ? t('manageSubscription.statusExpired')
                          : t('manageSubscription.statusActive')
                }
                variant="gold"
              />
            ) : (
              <Pill
                label={
                  success?.kind === 'trial'
                    ? t('manageSubscription.statusTrialing')
                    : t('manageSubscription.statusActive')
                }
                variant="gold"
              />
            )
          }
          stats={[
            {
              label: t('manageSubscription.access'),
              value: t('manageSubscription.unlocked'),
            },
            ...(periodEndLabel
              ? [
                  {
                    label: t('manageSubscription.periodEnds'),
                    value: periodEndLabel,
                  },
                ]
              : []),
          ]}
        />
        <Card style={styles.activePerks} padded>
          {[
            t('premium.successPerkAi'),
            t('premium.successPerkMocks'),
            t('premium.successPerkAnalytics'),
          ].map((perk) => (
            <View key={perk} style={styles.benefitRow}>
              <Check size={16} color={PREMIUM.goldDeep} strokeWidth={2.4} />
              <Text style={styles.benefitText}>{perk}</Text>
            </View>
          ))}
        </Card>
        <Button
          label={t('premium.manage')}
          variant="gold"
          fullWidth
          onPress={() => navigation.navigate('ManageSubscription')}
        />
        {successDialog}
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('premium.title')}
      subtitle={t('premium.subtitle')}
      contentStyle={styles.content}
    >
      <Animated.View entering={enter(0)}>
        <PremiumHeroCard
          icon={heroIcon}
          eyebrow={canClaimWelcome ? t('premium.welcomeOfferBadge') : t('premium.goPremium')}
          title={canClaimWelcome ? t('premium.welcomeOfferTitle') : heroTitle}
          hint={canClaimWelcome ? t('premium.welcomeOfferBody') : heroSub}
          trailing={
            canClaimWelcome ? (
              <Pill label={t('premium.trialPlanLabel')} variant="gold" />
            ) : undefined
          }
        />
      </Animated.View>

      <Animated.View entering={enter(80)}>
        <PremiumSectionLabel title={copy.benefitsTitle} />
        <Card style={styles.benefits} padded>
          {copy.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Check size={16} color={PREMIUM.goldDeep} strokeWidth={2.4} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Animated.View entering={enter(140)}>
        <PremiumSectionLabel title={t('premium.choosePlan')} />
        <View style={styles.plans}>
          {plans.map((item) => {
            const selected = plan === item.id;
            const isYearly = item.id === 'yearly';
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPlan(item.id as PremiumPlanId)}
                style={({ pressed }) => [
                  styles.planCard,
                  selected && styles.planCardSelected,
                  pressed && styles.planCardPressed,
                ]}
              >
                {isYearly ? (
                  <LinearGradient
                    colors={[PREMIUM.goldLt, PREMIUM.gold]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.planAccent}
                  />
                ) : null}
                {selected ? <View style={styles.planGlow} pointerEvents="none" /> : null}
                <View style={styles.planHeader}>
                  <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
                    {item.label}
                  </Text>
                  {isYearly ? <Pill label={t('premium.bestValue')} variant="gold" /> : null}
                </View>
                <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
                  {item.displayAmount}
                </Text>
                <Text style={styles.planSub}>{item.description}</Text>
                <View style={[styles.planCta, selected && styles.planCtaSelected]}>
                  <Text style={[styles.planCtaText, selected && styles.planCtaTextSelected]}>
                    {selected ? t('premium.selected') : t('premium.select')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {!paymentsConfigured ? (
        <Animated.View entering={enter(180)} testID="premium-coming-soon">
          <Card style={styles.comingSoonNotice} padded>
            <Text style={styles.comingSoonTitle}>{t('premium.paymentsComingSoon')}</Text>
            <Text style={styles.comingSoonBody}>{t('premium.paymentsComingSoonBody')}</Text>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(200)} style={styles.ctaStack}>
        {canClaimWelcome ? (
          <Button
            label={copy.trialCta}
            testID="premium-start-trial"
            variant="gold"
            icon={<Gift size={18} color="#251C08" strokeWidth={2.2} />}
            loading={loading}
            onPress={() => void handleTrial()}
            fullWidth
          />
        ) : null}
        {paymentsConfigured ? (
          <Button
            label={`${copy.subscribeCta} · ${selectedPlan?.displayAmount ?? ''}`}
            testID="premium-subscribe"
            icon={<Zap size={18} color="#FFFFFF" strokeWidth={2.2} />}
            loading={loading}
            onPress={() => void handleSubscribe()}
            fullWidth
          />
        ) : (
          <Button
            label={t('premium.paymentsComingSoon')}
            testID="premium-subscribe-unavailable"
            disabled
            fullWidth
          />
        )}
      </Animated.View>
      <Text style={styles.disclaimer}>{t('premium.disclaimerFull')}</Text>
      {successDialog}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    benefits: { gap: theme.spacing.md },
    activePerks: { gap: theme.spacing.md },
    comingSoonNotice: {
      gap: theme.spacing.xs,
      borderColor: PREMIUM.gold,
      backgroundColor: PREMIUM.goldSoft,
    },
    comingSoonTitle: {
      ...theme.typography.presets.body,
      color: PREMIUM.ink,
      fontWeight: '700',
    },
    comingSoonBody: {
      ...theme.typography.presets.caption,
      color: PREMIUM.muted,
      lineHeight: 18,
    },
    benefitRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
    benefitText: {
      ...theme.typography.presets.body,
      color: PREMIUM.ink,
      flex: 1,
      fontWeight: '600',
      lineHeight: 21,
    },
    plans: { flexDirection: 'row', gap: theme.spacing.md },
    planCard: {
      flex: 1,
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
      borderRadius: PREMIUM.cardRadius,
      borderWidth: 1,
      borderColor: PREMIUM.hairline,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
    planCardSelected: {
      borderWidth: 2,
      borderColor: PREMIUM.gold,
      backgroundColor: PREMIUM.goldSoft,
      transform: [{ scale: 1.01 }],
    },
    planCardPressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
    planAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    planGlow: {
      position: 'absolute',
      top: -30,
      right: -24,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    planLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: PREMIUM.ink,
    },
    planLabelSelected: { color: PREMIUM.accent },
    planPrice: {
      ...theme.typography.presets.h3,
      color: PREMIUM.ink,
    },
    planPriceSelected: { color: PREMIUM.goldDeep },
    planSub: { ...theme.typography.presets.caption, color: PREMIUM.sectionLabel },
    planCta: {
      marginTop: 4,
      borderRadius: 99,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: PREMIUM.hairline,
      backgroundColor: '#FFFFFF',
    },
    planCtaSelected: {
      backgroundColor: PREMIUM.accent,
      borderColor: PREMIUM.accent,
    },
    planCtaText: {
      fontSize: 12,
      fontWeight: '800',
      color: PREMIUM.sectionLabel,
    },
    planCtaTextSelected: { color: '#FFFFFF' },
    ctaStack: { gap: theme.spacing.sm, marginTop: 4 },
    disclaimer: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

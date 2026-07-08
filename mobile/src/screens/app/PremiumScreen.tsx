import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Pill, PremiumHeroCard, Screen } from '../../components';
import { PREMIUM, PremiumIcon, PremiumSectionLabel } from '../../components/premium';
import { useAuth } from '../../auth';
import { useExperiments } from '../../experiments';
import { usePremiumPlans, useSubscriptionEntitlement } from '../../hooks';
import { parseApiError } from '../../api';
import type { PremiumPlanId } from '../../api/payments';
import {
  checkoutPremiumPlan,
  startFreeTrial,
  type SubscriptionPlan,
} from '../../payments/subscriptionFlow';
import { Check, Crown, Sparkles, Zap } from 'lucide-react-native';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';

type PremiumNav = NativeStackNavigationProp<MainStackParamList, 'Premium'>;
type PremiumRoute = RouteProp<MainStackParamList, 'Premium'>;

export function PremiumScreen() {
  const navigation = useNavigation<PremiumNav>();
  const route = useRoute<PremiumRoute>();
  const paywall = route.params;
  const { user, setSessionUser, refreshUser } = useAuth();
  const { payloads, trackEvent } = useExperiments();
  const copy = payloads.paywall_copy;
  const heroTitle = paywall?.paywallTitle ?? copy.heroTitle;
  const heroSub = paywall?.paywallMessage ?? copy.heroSub;
  const trackedView = useRef(false);
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPremium = user?.isPremium;
  const plansQuery = usePremiumPlans();
  const entitlementQuery = useSubscriptionEntitlement(Boolean(isPremium));

  const [plan, setPlan] = useState<SubscriptionPlan>(
    paywall?.plan === 'monthly' || paywall?.plan === 'yearly' ? paywall.plan : 'yearly',
  );
  const [loading, setLoading] = useState(false);

  const plans = plansQuery.data?.plans ?? [];
  const selectedPlan = plans.find((item) => item.id === plan);

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

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await checkoutPremiumPlan(plan, {
        name: user?.name,
        email: user?.email,
        contact: user?.phone,
      });
      setSessionUser(result.user);
      await refreshUser();
      Alert.alert(t('premium.welcomeTitle'), t('premium.welcomeBody'));
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.message?.toLowerCase().includes('cancelled')) {
        return;
      }
      Alert.alert(t('premium.paymentFailed'), parsed.message ?? t('premium.paymentFailedDefault'));
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
      Alert.alert(t('premium.trialStartedTitle'), t('premium.trialStartedBody'));
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(t('premium.trialFailedTitle'), parsed.message ?? t('premium.trialFailedDefault'));
    } finally {
      setLoading(false);
    }
  };

  const heroIcon = (
    <PremiumIcon Icon={Crown} tone="gold" size="lg" filled surface="dark" />
  );

  if (plansQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={PREMIUM.gold} />
      </Screen>
    );
  }

  if (isPremium) {
    const entitlement = entitlementQuery.data?.entitlement;
    const periodEnd = entitlement?.currentPeriodEnd ?? user?.premiumExpiresAt;
    const planLabel =
      entitlement?.status === 'trialing' || user?.premiumPlan === 'trial'
        ? t('premium.trialActive')
        : entitlement?.plan ?? user?.premiumPlan
          ? t('premium.planSuffix', { plan: entitlement?.plan ?? user?.premiumPlan })
          : t('premium.premiumActive');

    return (
      <Screen scroll contentContainerStyle={styles.content}>
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
                    : entitlement.status.replace('_', ' ')
                }
                variant="gold"
              />
            ) : undefined
          }
          stats={
            periodEnd
              ? [
                  {
                    label: t('manageSubscription.access'),
                    value: t('manageSubscription.unlocked'),
                  },
                  {
                    label: t('manageSubscription.periodEnds'),
                    value: formatDate(periodEnd, { day: 'numeric', month: 'short', year: 'numeric' }),
                  },
                ]
              : undefined
          }
        />
        <Button
          label={t('premium.manage')}
          variant="gold"
          fullWidth
          onPress={() => navigation.navigate('ManageSubscription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PremiumHeroCard icon={heroIcon} eyebrow="Go Premium" title={heroTitle} hint={heroSub} />

      <PremiumSectionLabel title={copy.benefitsTitle} />
      <Card style={styles.benefits} padded>
        {copy.benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.benefitCheck}>
              <Check size={14} color={PREMIUM.goldDeep} strokeWidth={2.5} />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </Card>

      <PremiumSectionLabel title={t('premium.choosePlan')} />
      <View style={styles.plans}>
        {plans.map((item) => {
          const selected = plan === item.id;
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
              <View style={styles.planHeader}>
                <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
                  {item.label}
                </Text>
                {item.id === 'yearly' ? <Pill label={t('premium.bestValue')} variant="gold" /> : null}
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

      <Button
        label={copy.trialCta}
        testID="premium-start-trial"
        variant="gold"
        icon={<Sparkles size={18} color={theme.colors.brand.onPrimary} />}
        loading={loading}
        onPress={() => void handleTrial()}
        fullWidth
      />
      <Button
        label={`${copy.subscribeCta} · ${selectedPlan?.displayAmount ?? ''}`}
        testID="premium-subscribe"
        icon={<Zap size={18} color={theme.colors.brand.onPrimary} />}
        loading={loading}
        onPress={() => void handleSubscribe()}
        fullWidth
      />
      <Text style={styles.disclaimer}>{t('premium.disclaimerFull')}</Text>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    benefits: { gap: theme.spacing.md },
    benefitRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
    benefitCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: PREMIUM.goldSoft,
      borderWidth: 1,
      borderColor: PREMIUM.gold,
      marginTop: 1,
    },
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
      backgroundColor: theme.colors.surface.default,
    },
    planCardSelected: {
      borderWidth: 2,
      borderColor: PREMIUM.gold,
      backgroundColor: PREMIUM.goldSoft,
    },
    planCardPressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: PREMIUM.hairline,
      backgroundColor: theme.colors.surface.default,
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
    disclaimer: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

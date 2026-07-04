import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Pill, PremiumHeroCard, Screen, SectionTitle } from '../../components';
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
import {
  Check,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react-native';
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

  const [plan, setPlan] = useState<SubscriptionPlan>('yearly');
  const [loading, setLoading] = useState(false);

  const plans = plansQuery.data?.plans ?? [];
  const selectedPlan = plans.find((item) => item.id === plan);

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

  if (plansQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (isPremium) {
    const entitlement = entitlementQuery.data?.entitlement;

    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <PremiumHeroCard
          icon={<Crown size={24} color="#FFFFFF" strokeWidth={1.8} />}
          eyebrow={t('premium.proActive')}
          title={
            entitlement?.status === 'trialing' || user?.premiumPlan === 'trial'
              ? t('premium.trialActive')
              : entitlement?.plan ?? user?.premiumPlan
                ? t('premium.planSuffix', { plan: entitlement?.plan ?? user?.premiumPlan })
                : t('premium.premiumActive')
          }
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
          hint={
            (entitlement?.currentPeriodEnd ?? user?.premiumExpiresAt)
              ? t('premium.until', {
                  date: formatDate(entitlement?.currentPeriodEnd ?? user?.premiumExpiresAt!),
                })
              : undefined
          }
        />
        <Button
          label={t('premium.manage')}
          variant="ghost"
          fullWidth
          onPress={() => navigation.navigate('ManageSubscription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PremiumHeroCard
        icon={<Crown size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow="Go Premium"
        title={heroTitle}
        hint={heroSub}
      />

      <SectionTitle title={copy.benefitsTitle} />
      <Card style={styles.benefits}>
        {copy.benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Check size={18} color={theme.colors.semantic.success} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle title={t('premium.choosePlan')} />
      <View style={styles.plans}>
        {plans.map((item) => {
          const selected = plan === item.id;
          return (
            <Card
              key={item.id}
              style={selected ? { ...styles.planCard, ...styles.planCardSelected } : styles.planCard}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planLabel}>{item.label}</Text>
                {item.id === 'yearly' ? <Pill label={t('premium.bestValue')} variant="gold" /> : null}
              </View>
              <Text style={styles.planPrice}>{item.displayAmount}</Text>
              <Text style={styles.planSub}>{item.description}</Text>
              <Button
                label={selected ? t('premium.selected') : t('premium.select')}
                variant={selected ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setPlan(item.id as PremiumPlanId)}
                fullWidth
              />
            </Card>
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
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    benefits: { gap: theme.spacing.md },
    benefitRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
    benefitText: { ...theme.typography.presets.body, color: theme.colors.text.primary, flex: 1 },
    plans: { flexDirection: 'row', gap: theme.spacing.md },
    planCard: { flex: 1, gap: theme.spacing.sm },
    planCardSelected: { borderWidth: 2, borderColor: theme.colors.brand.primary },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    planPrice: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    planSub: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    disclaimer: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });
}

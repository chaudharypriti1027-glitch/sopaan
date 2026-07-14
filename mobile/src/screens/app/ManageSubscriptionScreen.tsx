import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  Calendar,
  Crown,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, FeatureScreenLayout, Pill, PremiumHeroCard, QueryStateView } from '../../components';
import { PREMIUM, PremiumIcon, PremiumSectionLabel } from '../../components/premium';
import { useAuth } from '../../auth';
import {
  useCancelSubscription,
  useNetworkStatus,
  useRestorePurchases,
  useSubscriptionEntitlement,
} from '../../hooks';
import type { EntitlementStatus } from '../../api/payments';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';

type ManageNav = NativeStackNavigationProp<MainStackParamList, 'ManageSubscription'>;

function statusVariant(status: EntitlementStatus): 'gold' | 'teal' | 'muted' {
  if (status === 'active' || status === 'trialing') return 'gold';
  return 'muted';
}

function formatAmount(paise: number, currency: string): string {
  if (currency === 'INR') {
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  }
  return `${paise} ${currency}`;
}

export function ManageSubscriptionScreen() {
  const navigation = useNavigation<ManageNav>();
  const { user, setSessionUser, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const entitlementQuery = useSubscriptionEntitlement();
  const restoreMutation = useRestorePurchases();
  const cancelMutation = useCancelSubscription();

  const entitlement = entitlementQuery.data?.entitlement;
  const history = entitlementQuery.data?.history ?? [];

  const statusLabel = useCallback(
    (status: EntitlementStatus) => {
      if (status === 'trialing') return t('manageSubscription.statusTrialing');
      if (status === 'active') return t('manageSubscription.statusActive');
      if (status === 'past_due') return t('manageSubscription.statusPastDue');
      if (status === 'cancelled') return t('manageSubscription.statusCancelled');
      return t('manageSubscription.statusExpired');
    },
    [t],
  );

  const formatEntitlementDate = useCallback(
    (value?: string | null) => {
      if (!value) return '—';
      return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' });
    },
    [formatDate],
  );

  const handleRestore = async () => {
    try {
      const result = await restoreMutation.mutateAsync();
      setSessionUser(result.user);
      await refreshUser();
      Alert.alert(
        result.restored
          ? t('manageSubscription.restoredTitle')
          : t('manageSubscription.upToDateTitle'),
        result.restored
          ? t('manageSubscription.restoredBody')
          : t('manageSubscription.upToDateBody'),
      );
    } catch (error) {
      Alert.alert(
        t('manageSubscription.restoreFailed'),
        error instanceof Error ? error.message : t('common:retry'),
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('manageSubscription.cancelTitle'),
      entitlement?.autoRenews
        ? t('manageSubscription.cancelBodyAutoRenew')
        : t('manageSubscription.cancelBodyNoRenew'),
      [
        { text: t('manageSubscription.keepPro'), style: 'cancel' },
        {
          text: t('manageSubscription.cancelAtPeriodEnd'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const result = await cancelMutation.mutateAsync({ atPeriodEnd: true });
                setSessionUser(result.user);
                await refreshUser();
                Alert.alert(
                  t('manageSubscription.cancelledTitle'),
                  t('manageSubscription.cancelledBody', {
                    date: formatEntitlementDate(entitlement?.currentPeriodEnd),
                  }),
                );
              } catch (error) {
                Alert.alert(
                  t('manageSubscription.cancelFailed'),
                  error instanceof Error ? error.message : t('common:retry'),
                );
              }
            })();
          },
        },
      ],
    );
  };

  const hasAccess = entitlement?.hasAccess ?? user?.isPremium;
  const heroIcon = (
    <PremiumIcon Icon={Crown} tone="gold" size="lg" filled surface="dark" />
  );

  const eyebrow = entitlement
    ? entitlement.plan === 'trial'
      ? t('manageSubscription.trial')
      : t('premium.planSuffix', { plan: entitlement.plan })
    : t('manageSubscription.heroTitle');

  return (
    <FeatureScreenLayout
      title={t('manageSubscription.title')}
      subtitle={t('manageSubscription.subtitle')}
      contentStyle={styles.content}
    >
      <QueryStateView
        isLoading={entitlementQuery.isLoading}
        isError={entitlementQuery.isError}
        isFetching={entitlementQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(entitlementQuery.data)}
        onRetry={() => void entitlementQuery.refetch()}
      >
        <PremiumHeroCard
          icon={heroIcon}
          eyebrow={eyebrow}
          title={t('manageSubscription.heroTitle')}
          trailing={
            entitlement ? (
              <Pill
                label={statusLabel(entitlement.status)}
                variant={statusVariant(entitlement.status)}
              />
            ) : undefined
          }
          stats={
            entitlement
              ? [
                  {
                    label: t('manageSubscription.periodEnds'),
                    value: formatEntitlementDate(entitlement.currentPeriodEnd),
                  },
                  {
                    label: t('manageSubscription.access'),
                    value: hasAccess
                      ? t('manageSubscription.unlocked')
                      : t('manageSubscription.expired'),
                  },
                ]
              : undefined
          }
          hint={!entitlement ? t('manageSubscription.noEntitlement') : undefined}
        />

        {entitlement ? (
          <Card style={styles.details} padded>
            <View style={styles.detailRow}>
              <PremiumIcon Icon={Calendar} tone="lavender" size="sm" filled />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t('manageSubscription.periodEnds')}</Text>
                <Text style={styles.detailValue}>
                  {formatEntitlementDate(entitlement.currentPeriodEnd)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <PremiumIcon Icon={ShieldCheck} tone="mint" size="sm" filled />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t('manageSubscription.access')}</Text>
                <Text style={styles.detailValue}>
                  {hasAccess
                    ? t('manageSubscription.unlocked')
                    : t('manageSubscription.expired')}
                </Text>
              </View>
            </View>

            {entitlement.cancelAtPeriodEnd ? (
              <View style={styles.detailRow}>
                <PremiumIcon Icon={XCircle} tone="gold" size="sm" filled />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{t('manageSubscription.renewal')}</Text>
                  <Text style={styles.detailValue}>
                    {t('manageSubscription.endsOn', {
                      date: formatEntitlementDate(entitlement.currentPeriodEnd),
                    })}
                  </Text>
                </View>
              </View>
            ) : null}

            {entitlement.status === 'past_due' ? (
              <View style={styles.alertBox}>
                <AlertCircle size={18} color={theme.colors.semantic.error} />
                <Text style={styles.alertText}>{t('manageSubscription.pastDueAlert')}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        <PremiumSectionLabel title={t('manageSubscription.actions')} />
        <View style={styles.actions}>
          <Button
            label={t('manageSubscription.restorePurchases')}
            variant="ghost"
            icon={<RefreshCw size={18} color={PREMIUM.accent} />}
            loading={restoreMutation.isPending}
            onPress={() => void handleRestore()}
            fullWidth
          />

          {!hasAccess ? (
            <Button
              label={t('manageSubscription.upgradeToPro')}
              variant="gold"
              onPress={() => navigation.navigate('Premium')}
              fullWidth
            />
          ) : null}

          {hasAccess &&
          entitlement &&
          entitlement.status !== 'cancelled' &&
          entitlement.status !== 'expired' ? (
            <Button
              label={t('manageSubscription.cancelSubscription')}
              variant="ghost"
              loading={cancelMutation.isPending}
              onPress={handleCancel}
              fullWidth
            />
          ) : null}
        </View>

        {history.length > 0 ? (
          <>
            <PremiumSectionLabel title={t('manageSubscription.paymentHistory')} />
            <Text style={styles.historySubtitle}>
              {t('manageSubscription.paymentHistorySubtitle')}
            </Text>
            <Card style={styles.history} padded>
              {history.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyText}>
                    <Text style={styles.historyTitle}>
                      {item.plan} · {formatAmount(item.amountPaise, item.currency)}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatEntitlementDate(item.createdAt)} · {item.status}
                    </Text>
                  </View>
                  <Pill
                    label={
                      item.status === 'paid'
                        ? t('manageSubscription.paid')
                        : item.status
                    }
                    variant={item.status === 'paid' ? 'teal' : 'muted'}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <Text style={styles.footerNote}>{t('manageSubscription.footerNote')}</Text>
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing['3xl'],
    },
    details: {
      gap: theme.spacing.lg,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    detailText: {
      flex: 1,
      gap: theme.spacing.xs / 2,
      paddingTop: 2,
    },
    detailLabel: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    detailValue: {
      ...theme.typography.presets.bodyMedium,
      color: PREMIUM.ink,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    alertBox: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.semantic.errorMuted,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(168,80,62,0.2)',
    },
    alertText: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
      flex: 1,
      lineHeight: 18,
    },
    actions: {
      gap: theme.spacing.sm,
    },
    historySubtitle: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      marginTop: -4,
      marginBottom: 8,
      marginHorizontal: 6,
    },
    history: {
      gap: theme.spacing.md,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: PREMIUM.hairline,
    },
    historyText: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    historyTitle: {
      ...theme.typography.presets.bodyMedium,
      color: PREMIUM.ink,
      textTransform: 'capitalize',
      fontWeight: '700',
    },
    historyMeta: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
    },
    footerNote: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 4,
    },
  });
}

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  Calendar,
  Crown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, FeatureScreenLayout, Pill, PremiumHeroCard, QueryStateView } from '../../components';
import { PREMIUM, PremiumIcon, PremiumSectionLabel, usePremiumDialog } from '../../components/premium';
import { useAuth } from '../../auth';
import {
  useCancelSubscription,
  useNetworkStatus,
  useProGate,
  useRestorePurchases,
  useSubscriptionEntitlement,
} from '../../hooks';
import type { EntitlementStatus } from '../../api/payments';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { INVALID_DATE_FALLBACK } from '../../i18n/format';
import { useFormat } from '../../i18n/useFormat';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';

type ManageNav = NativeStackNavigationProp<MainStackParamList, 'ManageSubscription'>;

function statusVariant(
  status: EntitlementStatus,
  cancelAtPeriodEnd: boolean,
  hasAccess: boolean,
): 'gold' | 'teal' | 'muted' {
  if (hasAccess && (status === 'active' || status === 'trialing') && !cancelAtPeriodEnd) {
    return 'gold';
  }
  if (hasAccess && (cancelAtPeriodEnd || status === 'cancelled')) {
    return 'teal';
  }
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
  const { alert, confirm } = usePremiumDialog();
  const { isPro, tier, refetchTier } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const entitlementQuery = useSubscriptionEntitlement();
  const restoreMutation = useRestorePurchases();
  const cancelMutation = useCancelSubscription();

  const entitlement = entitlementQuery.data?.entitlement;
  const history = entitlementQuery.data?.history ?? [];
  const hasAccess = entitlement?.hasAccess ?? Boolean(user?.isPremium);
  const endingSoon = Boolean(hasAccess && (entitlement?.cancelAtPeriodEnd || entitlement?.status === 'cancelled'));

  const statusLabel = useCallback(
    (status: EntitlementStatus) => {
      if (endingSoon && hasAccess) {
        return t('manageSubscription.statusEnding');
      }
      if (status === 'trialing') return t('manageSubscription.statusTrialing');
      if (status === 'active') return t('manageSubscription.statusActive');
      if (status === 'past_due') return t('manageSubscription.statusPastDue');
      if (status === 'cancelled') return t('manageSubscription.statusCancelled');
      return t('manageSubscription.statusExpired');
    },
    [endingSoon, hasAccess, t],
  );

  const formatEntitlementDate = useCallback(
    (value?: string | number | Date | null) => {
      const label = formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' });
      return label === INVALID_DATE_FALLBACK ? t('manageSubscription.expired') : label;
    },
    [formatDate, t],
  );

  const syncAfterBillingChange = useCallback(
    async (nextUser: typeof user) => {
      if (nextUser) {
        setSessionUser(nextUser);
      }
      await Promise.all([refreshUser(), refetchTier(), entitlementQuery.refetch()]);
    },
    [entitlementQuery, refetchTier, refreshUser, setSessionUser],
  );

  const handleRestore = async () => {
    try {
      const result = await restoreMutation.mutateAsync();
      await syncAfterBillingChange(result.user);
      alert({
        title: result.restored
          ? t('manageSubscription.restoredTitle')
          : t('manageSubscription.upToDateTitle'),
        message: result.restored
          ? t('manageSubscription.restoredBody')
          : t('manageSubscription.upToDateBody'),
        icon: 'sparkles',
        iconTone: 'gold',
      });
    } catch (error) {
      alert({
        title: t('manageSubscription.restoreFailed'),
        message: getUserFacingMessage(error),
        icon: 'info',
        iconTone: 'coral',
      });
    }
  };

  const handleCancel = () => {
    const periodEndLabel = formatEntitlementDate(entitlement?.currentPeriodEnd);
    confirm({
      title: t('manageSubscription.cancelTitle'),
      message: entitlement?.autoRenews
        ? t('manageSubscription.cancelBodyAutoRenew', { date: periodEndLabel })
        : t('manageSubscription.cancelBodyNoRenew', { date: periodEndLabel }),
      cancelLabel: t('manageSubscription.keepPro'),
      confirmLabel: t('manageSubscription.cancelAtPeriodEnd'),
      tone: 'danger',
      icon: 'logout',
      onConfirm: () => {
        void (async () => {
          try {
            const result = await cancelMutation.mutateAsync({ atPeriodEnd: true });
            await syncAfterBillingChange(result.user);
            const endsOn = formatEntitlementDate(
              result.entitlement?.currentPeriodEnd ?? entitlement?.currentPeriodEnd,
            );
            alert({
              title: t('manageSubscription.cancelledTitle'),
              message: t('manageSubscription.cancelledBody', { date: endsOn }),
              icon: 'info',
              iconTone: 'navy',
            });
          } catch (error) {
            alert({
              title: t('manageSubscription.cancelFailed'),
              message: getUserFacingMessage(error),
              icon: 'info',
              iconTone: 'coral',
            });
          }
        })();
      },
    });
  };

  const heroIcon = (
    <PremiumIcon Icon={Crown} tone="gold" size="lg" filled surface="dark" />
  );

  const eyebrow = entitlement
    ? entitlement.plan === 'trial'
      ? t('manageSubscription.trial')
      : t('premium.planSuffix', { plan: entitlement.plan })
    : t('manageSubscription.heroTitle');

  const freeLimits = tier?.limits;
  const showFreeLimits = !hasAccess && !isPro && Boolean(freeLimits);

  const canCancel =
    hasAccess &&
    entitlement &&
    entitlement.status !== 'expired' &&
    !entitlement.cancelAtPeriodEnd &&
    entitlement.status !== 'cancelled';

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
                variant={statusVariant(
                  entitlement.status,
                  Boolean(entitlement.cancelAtPeriodEnd),
                  Boolean(hasAccess),
                )}
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

        {endingSoon && entitlement ? (
          <View
            style={styles.endingBanner}
            accessibilityRole="text"
            accessibilityLabel={t('manageSubscription.endingBannerA11y', {
              date: formatEntitlementDate(entitlement.currentPeriodEnd),
            })}
          >
            <AlertCircle size={18} color={PREMIUM.accent} />
            <Text style={styles.endingBannerText}>
              {t('manageSubscription.endingBanner', {
                date: formatEntitlementDate(entitlement.currentPeriodEnd),
              })}
            </Text>
          </View>
        ) : null}

        {entitlement ? (
          <Card style={styles.details} padded>
            <View style={styles.detailRow}>
              <Calendar size={18} color={PREMIUM.accent} strokeWidth={2.2} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t('manageSubscription.periodEnds')}</Text>
                <Text style={styles.detailValue}>
                  {formatEntitlementDate(entitlement.currentPeriodEnd)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <ShieldCheck size={18} color={PREMIUM.accent} strokeWidth={2.2} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t('manageSubscription.access')}</Text>
                <Text style={styles.detailValue}>
                  {hasAccess
                    ? t('manageSubscription.unlocked')
                    : t('manageSubscription.expired')}
                </Text>
              </View>
            </View>

            {entitlement.cancelAtPeriodEnd || entitlement.status === 'cancelled' ? (
              <View style={styles.detailRow}>
                <XCircle size={18} color={PREMIUM.accent} strokeWidth={2.2} />
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
              <View style={styles.alertBox} accessibilityRole="alert">
                <AlertCircle size={18} color={theme.colors.semantic.error} />
                <Text style={styles.alertText}>{t('manageSubscription.pastDueAlert')}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {showFreeLimits && freeLimits ? (
          <Card style={styles.limitsCard} padded>
            <View style={styles.limitsHeader}>
              <Sparkles size={18} color={PREMIUM.accent} strokeWidth={2.2} />
              <Text style={styles.limitsTitle}>{t('manageSubscription.freeLimitsTitle')}</Text>
            </View>
            <Text style={styles.limitsBody}>{t('manageSubscription.freeLimitsBody')}</Text>
            <View style={styles.limitsList}>
              <Text style={styles.limitRow}>
                {t('manageSubscription.limitAiTests', { count: freeLimits.aiGenerateTestsPerDay })}
              </Text>
              <Text style={styles.limitRow}>
                {t('manageSubscription.limitAiDoubts', { count: freeLimits.aiDoubtsFastPerDay })}
              </Text>
              <Text style={styles.limitRow}>
                {t('manageSubscription.limitAiEval', { count: freeLimits.aiEvaluationsPerDay })}
              </Text>
              <Text style={styles.limitRow}>
                {t('manageSubscription.limitMocks', { count: freeLimits.mocksPerDay })}
              </Text>
              <Text style={styles.limitRow}>{t('manageSubscription.limitAnalytics')}</Text>
            </View>
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
            accessibilityHint={t('manageSubscription.restoreA11yHint')}
            fullWidth
          />

          {!hasAccess ? (
            <Button
              label={t('manageSubscription.upgradeToPro')}
              variant="gold"
              onPress={() => navigation.navigate('Premium')}
              accessibilityHint={t('manageSubscription.upgradeA11yHint')}
              fullWidth
            />
          ) : null}

          {canCancel ? (
            <Button
              label={t('manageSubscription.cancelSubscription')}
              variant="ghost"
              loading={cancelMutation.isPending}
              onPress={handleCancel}
              accessibilityHint={t('manageSubscription.cancelA11yHint')}
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
                        : item.status === 'failed'
                          ? t('manageSubscription.paymentFailed')
                          : item.status === 'refunded'
                            ? t('manageSubscription.refunded')
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
      borderRadius: PREMIUM.cardRadius,
      borderColor: PREMIUM.goldBorder,
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
    endingBanner: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: PREMIUM.goldSoft,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: PREMIUM.goldBorder,
    },
    endingBannerText: {
      ...theme.typography.presets.caption,
      color: PREMIUM.ink,
      flex: 1,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    limitsCard: {
      gap: theme.spacing.sm,
      borderRadius: PREMIUM.cardRadius,
      borderColor: PREMIUM.hairline,
    },
    limitsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    limitsTitle: {
      ...theme.typography.presets.bodyMedium,
      color: PREMIUM.ink,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      flex: 1,
    },
    limitsBody: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      lineHeight: 18,
    },
    limitsList: {
      gap: 6,
      marginTop: 4,
    },
    limitRow: {
      ...theme.typography.presets.caption,
      color: PREMIUM.ink,
      lineHeight: 18,
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
      borderRadius: PREMIUM.cardRadius,
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

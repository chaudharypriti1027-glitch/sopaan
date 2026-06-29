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
import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Pill, Screen, SectionTitle } from '../../components';
import { useAuth } from '../../auth';
import {
  useCancelSubscription,
  useRestorePurchases,
  useSubscriptionEntitlement,
} from '../../hooks';
import type { EntitlementStatus } from '../../api/payments';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type ManageNav = NativeStackNavigationProp<MainStackParamList, 'ManageSubscription'>;

function statusLabel(status: EntitlementStatus): string {
  if (status === 'trialing') return 'Free trial';
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Payment issue';
  if (status === 'cancelled') return 'Cancelled';
  return 'Expired';
}

function statusVariant(status: EntitlementStatus): 'gold' | 'teal' | 'muted' {
  if (status === 'active' || status === 'trialing') return 'gold';
  if (status === 'past_due') return 'muted';
  return 'muted';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  const entitlementQuery = useSubscriptionEntitlement();
  const restoreMutation = useRestorePurchases();
  const cancelMutation = useCancelSubscription();

  const entitlement = entitlementQuery.data?.entitlement;
  const history = entitlementQuery.data?.history ?? [];

  const handleRestore = async () => {
    try {
      const result = await restoreMutation.mutateAsync();
      setSessionUser(result.user);
      await refreshUser();
      Alert.alert(
        result.restored ? 'Purchases restored' : 'Already up to date',
        result.restored
          ? 'Your Sopaan Pro access has been synced from our servers.'
          : 'No additional purchases were found to restore.',
      );
    } catch (error) {
      Alert.alert('Could not restore', error instanceof Error ? error.message : 'Try again later.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Sopaan Pro?',
      entitlement?.autoRenews
        ? 'Auto-renew will stop. You keep access until the end of your current billing period.'
        : 'You will keep access until the end of your current period. No further charges will be made.',
      [
        { text: 'Keep Pro', style: 'cancel' },
        {
          text: 'Cancel at period end',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const result = await cancelMutation.mutateAsync({ atPeriodEnd: true });
                setSessionUser(result.user);
                await refreshUser();
                Alert.alert(
                  'Subscription cancelled',
                  `Access continues until ${formatDate(entitlement?.currentPeriodEnd)}.`,
                );
              } catch (error) {
                Alert.alert(
                  'Could not cancel',
                  error instanceof Error ? error.message : 'Try again later.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  if (entitlementQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  const hasAccess = entitlement?.hasAccess ?? user?.isPremium;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Card style={styles.hero}>
        <Crown size={36} color={theme.colors.accent.gold} />
        <Text style={styles.heroTitle}>Sopaan Pro</Text>
        {entitlement ? (
          <View style={styles.statusRow}>
            <Pill label={statusLabel(entitlement.status)} variant={statusVariant(entitlement.status)} />
            <Text style={styles.planText}>
              {entitlement.plan === 'trial' ? 'Trial' : `${entitlement.plan} plan`}
            </Text>
          </View>
        ) : (
          <Text style={styles.heroSub}>No active entitlement on file.</Text>
        )}
      </Card>

      {entitlement ? (
        <Card style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={theme.colors.brand.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Current period ends</Text>
              <Text style={styles.detailValue}>{formatDate(entitlement.currentPeriodEnd)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <ShieldCheck size={18} color={theme.colors.semantic.success} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Access</Text>
              <Text style={styles.detailValue}>{hasAccess ? 'Unlocked' : 'Expired'}</Text>
            </View>
          </View>

          {entitlement.cancelAtPeriodEnd ? (
            <View style={styles.detailRow}>
              <XCircle size={18} color={theme.colors.semantic.warning} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Renewal</Text>
                <Text style={styles.detailValue}>Ends on {formatDate(entitlement.currentPeriodEnd)}</Text>
              </View>
            </View>
          ) : null}

          {entitlement.status === 'past_due' ? (
            <View style={styles.alertBox}>
              <AlertCircle size={18} color={theme.colors.semantic.error} />
              <Text style={styles.alertText}>
                Your last payment failed. Restore purchases or renew to keep Pro access.
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <SectionTitle title="Actions" />
      <View style={styles.actions}>
        <Button
          label="Restore purchases"
          variant="ghost"
          icon={<RefreshCw size={18} color={theme.colors.brand.primary} />}
          loading={restoreMutation.isPending}
          onPress={() => void handleRestore()}
          fullWidth
        />

        {!hasAccess ? (
          <Button
            label="Upgrade to Pro"
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
            label="Cancel subscription"
            variant="ghost"
            loading={cancelMutation.isPending}
            onPress={handleCancel}
            fullWidth
          />
        ) : null}
      </View>

      {history.length > 0 ? (
        <>
          <SectionTitle title="Payment history" subtitle="Verified server-side via Razorpay" />
          <Card style={styles.history}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>
                    {item.plan} · {formatAmount(item.amountPaise, item.currency)}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {formatDate(item.createdAt)} · {item.status}
                  </Text>
                </View>
                <Pill
                  label={item.status === 'paid' ? 'Paid' : item.status}
                  variant={item.status === 'paid' ? 'teal' : 'muted'}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Text style={styles.footerNote}>
        All purchases are verified on our servers. The app never grants Pro access from client-side
        receipts alone.
      </Text>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing['3xl'],
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.accent.goldMuted,
    },
    heroTitle: {
      ...theme.typography.presets.h2,
      color: theme.colors.text.primary,
    },
    heroSub: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    statusRow: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    planText: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      textTransform: 'capitalize',
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
    },
    detailLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    detailValue: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    alertBox: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.semantic.errorMuted,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
    },
    alertText: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
      flex: 1,
    },
    actions: {
      gap: theme.spacing.sm,
    },
    history: {
      gap: theme.spacing.md,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    historyText: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    historyTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      textTransform: 'capitalize',
    },
    historyMeta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    footerNote: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });
}

import { useCallback, useMemo } from 'react';
import { Copy, Gift, Share2, Users } from 'lucide-react-native';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Pill,
  PremiumHeroCard,
  QueryStateView,
  Screen,
  SectionTitle,
  StatTile,
} from '../../components';
import { PremiumIcon } from '../../components/premium/PremiumIcon';
import { useNetworkStatus, useReferralDashboard } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';

export function ReferEarnScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const dashboardQuery = useReferralDashboard();

  const data = dashboardQuery.data;

  const statusLabel = useCallback(
    (status: string) => {
      if (status === 'rewarded') return t('referEarn.statusRewarded');
      if (status === 'onboarding_complete') return t('referEarn.statusWaiting');
      if (status === 'rejected') return t('referEarn.statusRejected');
      return t('referEarn.statusSignedUp');
    },
    [t],
  );

  const statusVariant = (status: string): 'teal' | 'gold' | 'muted' => {
    if (status === 'rewarded') return 'teal';
    if (status === 'onboarding_complete') return 'gold';
    return 'muted';
  };

  const shareInvite = async () => {
    if (!data) {
      return;
    }

    await Share.share({
      message: `${data.shareText}\n${data.webLink}\n${data.appLink}`,
    });
  };

  const copyCode = async () => {
    if (!data?.code) {
      return;
    }

    await Share.share({ message: data.code });
  };

  const rewardHint = data
    ? t('referEarn.rewardHint', {
        referrer: data.rewards.referrerCoins,
        referee: data.rewards.refereeCoins,
        trial: data.rewards.refereeTrialDays
          ? t('referEarn.trialBonus', { days: data.rewards.refereeTrialDays })
          : '',
      })
    : undefined;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={t('referEarn.title')} subtitle={t('referEarn.subtitle')} />

      <QueryStateView
        isLoading={dashboardQuery.isLoading}
        isError={dashboardQuery.isError}
        isFetching={dashboardQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(data)}
        onRetry={() => void dashboardQuery.refetch()}
      >
        {data ? (
          <>
            <PremiumHeroCard
              icon={<PremiumIcon Icon={Gift} tone="gold" size="lg" filled surface="dark" />}
              eyebrow={t('referEarn.yourCode')}
              title={data.code}
              hint={rewardHint}
            >
              <View style={styles.heroActions}>
                <Button
                  label={t('referEarn.shareInvite')}
                  variant="gold"
                  icon={<Share2 size={18} color={theme.colors.text.inverse} />}
                  onPress={() => void shareInvite()}
                />
                <Button
                  label={t('referEarn.copyCode')}
                  variant="ghost"
                  onPress={() => void copyCode()}
                />
              </View>
            </PremiumHeroCard>

            <View style={styles.statsRow}>
              <StatTile
                label={t('referEarn.invited')}
                value={String(data.stats.invited)}
                icon={<PremiumIcon Icon={Users} tone="lavender" size="xs" filled />}
              />
              <StatTile
                label={t('referEarn.rewarded')}
                value={String(data.stats.rewarded)}
                icon={<PremiumIcon Icon={Gift} tone="gold" size="xs" filled />}
              />
              <StatTile
                label={t('referEarn.coinsEarned')}
                value={String(data.stats.coinsEarned)}
                icon={<PremiumIcon Icon={Copy} tone="mint" size="xs" filled />}
              />
            </View>

            <SectionTitle
              title={t('referEarn.yourReferrals')}
              subtitle={t('referEarn.referralsSubtitle')}
            />

            {data.referrals.length === 0 ? (
              <Card>
                <Text style={styles.empty}>{t('referEarn.noReferrals')}</Text>
              </Card>
            ) : (
              <Card padded={false}>
                {data.referrals.map((referral, index) => (
                  <View
                    key={referral.id}
                    style={[styles.referralRow, index < data.referrals.length - 1 && styles.referralBorder]}
                  >
                    <View style={styles.referralMeta}>
                      <Text style={styles.referralName}>{referral.refereeName}</Text>
                      <Text style={styles.referralDate}>
                        {t('referEarn.joined', {
                          date: formatDate(referral.refereeJoinedAt, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }),
                        })}
                      </Text>
                    </View>
                    <Pill label={statusLabel(referral.status)} variant={statusVariant(referral.status)} />
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : null}
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    heroActions: { width: '100%', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
    referralRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    referralBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    referralMeta: { flex: 1, gap: theme.spacing.xs / 2 },
    referralName: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    referralDate: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    empty: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}

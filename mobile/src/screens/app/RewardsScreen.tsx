import { Award, Coins } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Pill, Screen, SectionTitle } from '../../components';
import { useBadges, useProfile, useRedeemReward, useRewardsList } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';

export function RewardsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatNumber } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const rewardsQuery = useRewardsList({ limit: 20 });
  const badgesQuery = useBadges();
  const redeem = useRedeemReward();

  const coins = profileQuery.data?.user.coins ?? 0;
  const rewards = rewardsQuery.data?.items ?? [];
  const badges = badgesQuery.data ?? [];

  const handleRedeem = (id: string, title: string, cost: number) => {
    if (coins < cost) {
      Alert.alert(t('rewards.notEnoughTitle'), t('rewards.notEnoughBody', { cost, title }));
      return;
    }
    redeem.mutate(id, {
      onSuccess: (data) => {
        Alert.alert(
          t('rewards.redeemedTitle'),
          t('rewards.redeemedBody', { title, remaining: data.coinsRemaining }),
        );
      },
      onError: (err) => Alert.alert(t('rewards.redeemFailed'), String(err)),
    });
  };

  const loading = profileQuery.isLoading || rewardsQuery.isLoading;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={t('rewards.title')} testID="rewards-screen" subtitle={t('rewards.subtitle')} />

      <Card style={styles.balanceCard}>
        <Coins size={28} color={theme.colors.accent.gold} />
        <View>
          <Text style={styles.balanceLabel}>{t('rewards.balance')}</Text>
          <Text style={styles.balanceValue}>{formatNumber(coins)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>{t('rewards.badges')}</Text>
      {badgesQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : badges.length === 0 ? (
        <Card>
          <Text style={styles.empty}>{t('rewards.noBadges')}</Text>
        </Card>
      ) : (
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge.id ?? badge.key} style={styles.badgeTile}>
              <Award size={24} color={theme.colors.accent.gold} />
              <Text style={styles.badgeKey}>{badge.key.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>{t('rewards.redeemSection')}</Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <View style={styles.list}>
          {rewards.map((reward) => {
            const canAfford = coins >= reward.coinCost;
            return (
              <Card key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Pill
                    label={t('rewards.coinCost', { count: reward.coinCost })}
                    variant={canAfford ? 'primary' : 'muted'}
                  />
                </View>
                <Text style={styles.rewardType}>{reward.type}</Text>
                <Button
                  label={t('rewards.redeem')}
                  testID={`reward-redeem-${reward.id}`}
                  size="sm"
                  variant={canAfford ? 'gold' : 'ghost'}
                  disabled={!canAfford || redeem.isPending}
                  loading={redeem.isPending}
                  onPress={() => handleRedeem(reward.id, reward.title, reward.coinCost)}
                />
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    balanceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
      backgroundColor: theme.colors.accent.goldMuted,
    },
    balanceLabel: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    balanceValue: {
      ...theme.typography.presets.h2,
      fontFamily: theme.typography.fonts.stat.semibold,
      color: theme.colors.text.primary,
    },
    sectionLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    badgeTile: {
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radii.card,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      minWidth: 88,
    },
    badgeKey: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      textTransform: 'capitalize',
      textAlign: 'center',
    },
    list: { gap: theme.spacing.md },
    rewardCard: { gap: theme.spacing.sm },
    rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rewardTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    rewardType: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}

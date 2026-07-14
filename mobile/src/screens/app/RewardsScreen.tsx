import { Award, Coins } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, FeatureScreenLayout, Pill, PremiumHeroCard, PremiumSectionLabel } from '../../components';
import { useBadges, useProfile, useRedeemReward, useRewardsList } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { toneColors, toneForIndex } from '../../utils/iconTone';
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
    <FeatureScreenLayout
      title={t('rewards.title')}
      subtitle={t('rewards.subtitle')}
      contentStyle={styles.content}
    >
      <View testID="rewards-screen">

      <PremiumHeroCard
        icon={<Coins size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('rewards.balance')}
        title={formatNumber(coins)}
      />

      <PremiumSectionLabel title={t('rewards.badges')} compact />
      {badgesQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : badges.length === 0 ? (
        <Card>
          <Text style={styles.empty}>{t('rewards.noBadges')}</Text>
        </Card>
      ) : (
        <View style={styles.badgeRow}>
          {badges.map((badge, index) => {
            const tone = toneColors(toneForIndex(index));
            return (
              <View key={badge.id ?? badge.key} style={[styles.badgeTile, { backgroundColor: tone.bg, borderColor: tone.ring }]}>
                <Award size={24} color={tone.fg} />
                <Text style={[styles.badgeKey, { color: tone.fg }]}>{badge.key.replace(/_/g, ' ')}</Text>
              </View>
            );
          })}
        </View>
      )}

      <PremiumSectionLabel title={t('rewards.redeemSection')} compact />
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
      </View>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    badgeTile: {
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radii.card,
      borderWidth: 1,
      minWidth: 88,
    },
    badgeKey: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
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

import { useQuery } from '@tanstack/react-query';
import { Copy, Gift, Share2, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Pill, Screen, SectionTitle, StatTile } from '../../components';
import { getMyReferrals } from '../../api/referrals';
import { queryKeys } from '../../hooks/queryKeys';
import { useTheme } from '../../theme';

function statusLabel(status: string) {
  if (status === 'rewarded') return 'Rewarded';
  if (status === 'onboarding_complete') return 'Waiting for first mock';
  if (status === 'rejected') return 'Rejected';
  return 'Signed up';
}

function statusVariant(status: string): 'teal' | 'gold' | 'muted' {
  if (status === 'rewarded') return 'teal';
  if (status === 'onboarding_complete') return 'gold';
  return 'muted';
}

export function ReferEarnScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.referrals.me(),
    queryFn: getMyReferrals,
  });

  const data = dashboardQuery.data;

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

  if (dashboardQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.empty}>Could not load referral details.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Refer & Earn"
        subtitle="Invite friends — both of you earn coins after they finish onboarding and their first mock"
      />

      <Card style={styles.heroCard}>
        <Gift size={28} color={theme.colors.brand.primary} />
        <Text style={styles.codeLabel}>Your referral code</Text>
        <Text style={styles.codeValue}>{data.code}</Text>
        <Text style={styles.rewardHint}>
          You get {data.rewards.referrerCoins} coins · they get {data.rewards.refereeCoins} coins
          {data.rewards.refereeTrialDays
            ? ` + ${data.rewards.refereeTrialDays} bonus premium days`
            : ''}
        </Text>
        <View style={styles.heroActions}>
          <Button label="Share invite link" icon={<Share2 size={18} color="#fff" />} onPress={() => void shareInvite()} />
          <Button label="Copy code" variant="ghost" onPress={() => void copyCode()} />
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatTile label="Invited" value={String(data.stats.invited)} icon={<Users size={18} color={theme.colors.brand.primary} />} />
        <StatTile label="Rewarded" value={String(data.stats.rewarded)} icon={<Gift size={18} color={theme.colors.brand.primary} />} />
        <StatTile label="Coins earned" value={String(data.stats.coinsEarned)} icon={<Copy size={18} color={theme.colors.brand.primary} />} />
      </View>

      <SectionTitle title="Your referrals" subtitle="Track who joined with your code" />

      {data.referrals.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No referrals yet. Share your code to start earning.</Text>
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
                  Joined {new Date(referral.refereeJoinedAt).toLocaleDateString()}
                </Text>
              </View>
              <Pill label={statusLabel(referral.status)} variant={statusVariant(referral.status)} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    heroCard: { alignItems: 'center', gap: theme.spacing.sm },
    codeLabel: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    codeValue: {
      ...theme.typography.presets.statLarge,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.bold,
      letterSpacing: 1,
    },
    rewardHint: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
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

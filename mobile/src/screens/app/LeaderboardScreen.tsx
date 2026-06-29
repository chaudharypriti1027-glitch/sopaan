import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card, RankRing, Screen, SectionTitle } from '../../components';
import { useLeaderboard } from '../../hooks';
import { useAuth } from '../../auth';
import { useTheme } from '../../theme';

export function LeaderboardScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();

  const leaderboardQuery = useLeaderboard({ limit: 20 });
  const data = leaderboardQuery.data;
  const podium = (data?.entries ?? []).slice(0, 3);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Leaderboard" subtitle="Top performers by mock accuracy" />

      {leaderboardQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <>
          {podium.length >= 3 ? (
            <View style={styles.podium}>
              <View style={[styles.podiumSpot, styles.second]}>
                <Text style={styles.podiumRank}>2</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{podium[1].name}</Text>
                <Text style={styles.podiumScore}>{podium[1].avgAccuracy}%</Text>
              </View>
              <View style={[styles.podiumSpot, styles.first]}>
                <RankRing value={podium[0].avgAccuracy} max={100} size={72} variant="gold" />
                <Text style={styles.podiumName} numberOfLines={1}>{podium[0].name}</Text>
                <Text style={styles.podiumScore}>#{podium[0].rank}</Text>
              </View>
              <View style={[styles.podiumSpot, styles.third]}>
                <Text style={styles.podiumRank}>3</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{podium[2].name}</Text>
                <Text style={styles.podiumScore}>{podium[2].avgAccuracy}%</Text>
              </View>
            </View>
          ) : null}

          <Card style={styles.youRow}>
            <Text style={styles.youLabel}>Your rank</Text>
            <View style={styles.youStats}>
              <Text style={styles.youRank}>
                {data?.you.rank != null ? `#${data.you.rank}` : '—'}
              </Text>
              <Text style={styles.youMeta}>
                {data?.you.avgAccuracy ?? 0}% avg · {data?.you.attempts ?? 0} attempts
              </Text>
            </View>
            <Text style={styles.youName}>{user?.name ?? data?.you.name}</Text>
          </Card>

          <SectionTitle title="Rankings" />
          <Card style={styles.table}>
            {(data?.entries ?? []).map((entry) => (
              <View key={entry.userId} style={styles.row}>
                <Text style={styles.rowRank}>#{entry.rank}</Text>
                <Text style={styles.rowName}>{entry.name}</Text>
                <Text style={styles.rowScore}>{entry.avgAccuracy}%</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    podium: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
    podiumSpot: {
      flex: 1,
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surface.muted,
      borderRadius: theme.radii.card,
      padding: theme.spacing.md,
    },
    first: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.accent.goldMuted,
    },
    second: { paddingTop: theme.spacing.xl },
    third: { paddingTop: theme.spacing.lg },
    podiumRank: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.secondary,
    },
    podiumName: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
      textAlign: 'center',
    },
    podiumScore: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
    },
    youRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      borderWidth: 2,
      borderColor: theme.colors.brand.primary,
    },
    youLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    youStats: { flex: 1, gap: theme.spacing.xs },
    youRank: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    youMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    youName: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    table: { gap: theme.spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    rowRank: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
      width: 36,
    },
    rowName: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      flex: 1,
    },
    rowScore: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
  });
}

import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { SectionTitle } from './SectionTitle';
import { useLiveMockLeaderboard } from '../hooks/useSocket';
import { useTheme } from '../theme';

type Props = {
  testId: string;
  title?: string;
};

export function LiveMockLeaderboard({ testId, title = 'Live leaderboard' }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const leaderboard = useLiveMockLeaderboard(testId);

  return (
    <Card style={styles.card}>
      <SectionTitle title={title} subtitle="Updates as attempts are submitted" />
      {!leaderboard ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.loadingText}>Waiting for live rankings…</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {leaderboard.entries.length === 0 ? (
            <Text style={styles.empty}>No attempts yet — be the first!</Text>
          ) : (
            leaderboard.entries.slice(0, 10).map((entry) => (
              <View key={`${entry.userId}-${entry.rank}`} style={styles.row}>
                <Text style={styles.rank}>#{entry.rank}</Text>
                <View style={styles.meta}>
                  <Text style={styles.name}>{entry.name}</Text>
                  <Text style={styles.score}>
                    {entry.score} pts · {entry.accuracy}% · {Math.round(entry.totalTimeSec / 60)}m
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: { gap: theme.spacing.sm },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    loadingText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    list: { gap: theme.spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    rank: {
      width: 36,
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.primary,
    },
    meta: { flex: 1, gap: theme.spacing.xs / 2 },
    name: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    score: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}

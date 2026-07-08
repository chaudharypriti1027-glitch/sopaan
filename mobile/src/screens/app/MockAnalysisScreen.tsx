import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { BarChart2, Medal, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  AIBadge,
  BarChart,
  Card,
  ComparisonBars,
  PremiumHeroCard,
  RankRing,
  Screen,
  SectionTitle,
} from '../../components';
import { useAttempt, useAttempts } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type MockAnalysisRoute = RouteProp<MainStackParamList, 'MockAnalysis'>;

function formatMinutes(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function MockAnalysisScreen() {
  const route = useRoute<MockAnalysisRoute>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const attemptsQuery = useAttempts({ limit: 1 });
  const attemptId = route.params?.attemptId ?? attemptsQuery.data?.items[0]?.id;
  const attemptQuery = useAttempt(attemptId);

  const attempt = attemptQuery.data;
  const comparison = attempt?.comparison;
  const timePerSection = attempt?.timePerSection ?? [];

  const comparisonMetrics = comparison
    ? [
        { label: 'Score', you: comparison.you.score, topper: comparison.topper.score, average: comparison.average.score },
        {
          label: 'Accuracy',
          you: comparison.you.accuracy,
          topper: comparison.topper.accuracy,
          average: comparison.average.accuracy,
          unit: '%',
        },
        {
          label: 'Time',
          you: Math.round(comparison.you.totalTimeSec / 60),
          topper: Math.round(comparison.topper.totalTimeSec / 60),
          average: Math.round(comparison.average.totalTimeSec / 60),
          unit: 'm',
        },
      ]
    : [];

  const sectionChartData = timePerSection.map((section) => ({
    label: section.subject.slice(0, 8),
    value: Math.max(1, Math.round(section.totalTimeSec / 60)),
  }));

  if (attemptsQuery.isLoading || attemptQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (!attemptId || !attempt) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.emptyTitle}>No mock attempt yet</Text>
        <Text style={styles.emptySubtitle}>Complete a mock test to see detailed analysis.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        subtitle={attempt.test?.title ?? 'Performance breakdown'}
      />

      <PremiumHeroCard
        icon={<Medal size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow="Overall percentile"
        title={`${attempt.percentile ?? 0}th percentile`}
        stats={[
          { label: 'Rank', value: `#${attempt.rank ?? '—'}` },
          { label: 'Accuracy', value: `${attempt.accuracy ?? 0}%` },
          { label: 'Time', value: formatMinutes(attempt.totalTimeSec ?? 0) },
        ]}
      >
        <View style={styles.heroRingWrap}>
          <RankRing
            value={attempt.percentile ?? 0}
            max={100}
            label="Percentile"
            size={104}
            variant="gold"
            trackColor="rgba(255,255,255,0.15)"
            accentColor="#F4D58D"
            labelColor="rgba(255,255,255,0.6)"
          />
        </View>
      </PremiumHeroCard>

      {comparisonMetrics.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="You vs topper vs average" />
          <Card>
            <ComparisonBars metrics={comparisonMetrics} />
          </Card>
        </View>
      ) : null}

      {sectionChartData.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionTitle title="Time per section" />
            <BarChart2 size={18} color={theme.colors.text.tertiary} />
          </View>
          <Card>
            <BarChart data={sectionChartData} variant="teal" height={180} />
            <Text style={styles.chartCaption}>Minutes spent per subject</Text>
          </Card>
        </View>
      ) : null}

      {attempt.aiFeedback ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionTitle title="AI insight" />
            <AIBadge label="Coach" />
          </View>
          <Card style={styles.insightCard}>
            <Sparkles size={18} color={theme.colors.brand.primary} />
            <Text style={styles.insightText}>{attempt.aiFeedback}</Text>
          </Card>
        </View>
      ) : null}

      {attempt.weakTopics && attempt.weakTopics.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Weak topics" />
          <Card>
            <Text style={styles.weakTopics}>{attempt.weakTopics.join(' · ')}</Text>
          </Card>
        </View>
      ) : null}
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
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    emptySubtitle: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    heroRingWrap: {
      alignItems: 'center',
      zIndex: 1,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chartCaption: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    insightCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'flex-start',
    },
    insightText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      flex: 1,
    },
    weakTopics: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.semantic.error,
    },
  });
}

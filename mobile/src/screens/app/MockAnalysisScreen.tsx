import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { BarChart2, Medal, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  BarChart,
  ComparisonBars,
  FeatureScreenLayout,
  PremiumFeatureCard,
  PremiumHeroCard,
  PremiumScreen,
  RankRing,
  SectionTitle,
} from '../../components';
import { useAttempt, useAttempts } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type MockAnalysisRoute = RouteProp<MainStackParamList, 'MockAnalysis'>;

function formatMinutes(sec: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s > 0) {
    return t('mockAnalysis.timeFormat', { minutes: m, seconds: s });
  }
  return t('mockAnalysis.timeMinutes', { minutes: m });
}

export function MockAnalysisScreen() {
  const { t } = useTranslation('app');
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
        {
          label: t('mockAnalysis.score'),
          you: comparison.you.score,
          topper: comparison.topper.score,
          average: comparison.average.score,
        },
        {
          label: t('mockAnalysis.accuracy'),
          you: comparison.you.accuracy,
          topper: comparison.topper.accuracy,
          average: comparison.average.accuracy,
          unit: '%',
        },
        {
          label: t('mockAnalysis.time'),
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
      <PremiumScreen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </PremiumScreen>
    );
  }

  if (!attemptId || !attempt) {
    return (
      <FeatureScreenLayout title={t('mockAnalysis.title')}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t('mockAnalysis.noAttempt')}</Text>
          <Text style={styles.emptySubtitle}>{t('mockAnalysis.noAttemptBody')}</Text>
        </View>
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('mockAnalysis.title')}
      subtitle={attempt.test?.title ?? t('mockAnalysis.subtitleDefault')}
    >
      <PremiumHeroCard
        icon={<Medal size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('mockAnalysis.overallPercentile')}
        title={t('mockAnalysis.percentileValue', { value: attempt.percentile ?? 0 })}
        stats={[
          { label: t('mockAnalysis.rank'), value: `#${attempt.rank ?? '—'}` },
          { label: t('mockAnalysis.accuracy'), value: `${attempt.accuracy ?? 0}%` },
          { label: t('mockAnalysis.time'), value: formatMinutes(attempt.totalTimeSec ?? 0, t) },
        ]}
      >
        <View style={styles.heroRingWrap}>
          <RankRing
            value={attempt.percentile ?? 0}
            max={100}
            label={t('mockAnalysis.percentile')}
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
          <SectionTitle title={t('mockAnalysis.comparison')} />
          <PremiumFeatureCard>
            <ComparisonBars metrics={comparisonMetrics} />
          </PremiumFeatureCard>
        </View>
      ) : null}

      {sectionChartData.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionTitle title={t('mockAnalysis.timePerSection')} />
            <BarChart2 size={18} color={theme.colors.text.tertiary} />
          </View>
          <PremiumFeatureCard>
            <BarChart data={sectionChartData} variant="teal" height={180} />
            <Text style={styles.chartCaption}>{t('mockAnalysis.chartCaption')}</Text>
          </PremiumFeatureCard>
        </View>
      ) : null}

      {attempt.aiFeedback ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionTitle title={t('mockAnalysis.aiInsight')} />
            <AIBadge label={t('mockAnalysis.coachBadge')} />
          </View>
          <PremiumFeatureCard style={styles.insightCard}>
            <Sparkles size={18} color={theme.colors.brand.primary} />
            <Text style={styles.insightText}>{attempt.aiFeedback}</Text>
          </PremiumFeatureCard>
        </View>
      ) : null}

      {attempt.weakTopics && attempt.weakTopics.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title={t('mockAnalysis.weakTopics')} />
          <PremiumFeatureCard>
            <Text style={styles.weakTopics}>{attempt.weakTopics.join(' · ')}</Text>
          </PremiumFeatureCard>
        </View>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyWrap: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    emptyTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    emptySubtitle: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
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

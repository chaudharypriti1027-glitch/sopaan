import { BarChart2, TrendingUp } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  LineChart,
  PremiumHeroCard,
  ProgressBar,
  Screen,
  SectionTitle,
  SegTabs,
} from '../../components';
import type { AnalyticsRange } from '../../api/analytics';
import { useAnalyticsProgress, useProGate } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { useScreenPerf } from '../../perf';
import { useTheme } from '../../theme';

function formatDelta(delta: number | undefined, formatPercent: (value: number) => string): string | undefined {
  if (delta == null || delta === 0) {
    return undefined;
  }
  const formatted = formatPercent(Math.abs(delta));
  return delta > 0 ? `+${formatted}` : `-${formatted}`;
}

const MasteryRow = memo(function MasteryRow({
  subject,
  mastery,
  delta,
  attempts,
}: {
  subject: string;
  mastery: number;
  delta?: number | null;
  attempts: number;
}) {
  const { t } = useTranslation('app');
  const { formatPercent } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.masteryRow}>
      <View style={styles.masteryHeader}>
        <Text style={styles.masterySubject}>{subject}</Text>
        {delta != null && delta !== 0 ? (
          <Text style={[styles.masteryDelta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
            {formatDelta(delta, formatPercent)}
          </Text>
        ) : null}
      </View>
      <ProgressBar
        value={mastery}
        max={100}
        showValue
        variant={mastery >= 70 ? 'teal' : mastery >= 50 ? 'gold' : 'primary'}
      />
      <Text style={styles.masteryMeta}>{t('progressAnalytics.attemptsCount', { count: attempts })}</Text>
    </View>
  );
});

export function ProgressAnalyticsScreen() {
  const { t } = useTranslation('app');
  const { formatNumber, formatPercent } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [range, setRange] = useState<AnalyticsRange>('week');
  const { isPro, openPaywall } = useProGate();

  const rangeOptions = useMemo(
    () => [
      { key: 'week' as const, label: t('progressAnalytics.rangeWeek') },
      { key: 'month' as const, label: t('progressAnalytics.rangeMonth') },
      { key: 'all' as const, label: t('progressAnalytics.rangeAll') },
    ],
    [t],
  );

  const analyticsQuery = useAnalyticsProgress(range, isPro);
  const data = analyticsQuery.data;

  useScreenPerf('Analytics', {
    isContentReady: Boolean(data ?? analyticsQuery.isError),
    isInteractive: !analyticsQuery.isLoading || Boolean(data),
  });

  const accuracyChart = useMemo(
    () =>
      (data?.accuracyTrend ?? []).map((point) => ({
        label: point.date.slice(5),
        value: point.accuracy,
      })),
    [data?.accuracyTrend],
  );

  if (!isPro) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <SectionTitle title={t('progressAnalytics.title')} subtitle={t('progressAnalytics.proFeature')} />
        <Card style={styles.lockedCard}>
          <BarChart2 size={32} color={theme.colors.brand.primary} />
          <Text style={styles.lockedTitle}>{t('progressAnalytics.lockedTitle')}</Text>
          <Text style={styles.lockedBody}>{t('progressAnalytics.lockedBody')}</Text>
          <Button
            label={t('progressAnalytics.upgradeToPro')}
            variant="gold"
            fullWidth
            onPress={() => openPaywall({ feature: 'detailed_analytics' })}
          />
        </Card>
      </Screen>
    );
  }

  if (analyticsQuery.isLoading && !data) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={t('progressAnalytics.title')} subtitle={t('progressAnalytics.subtitle')} />

      <SegTabs options={rangeOptions} value={range} onChange={setRange} />

      <PremiumHeroCard
        icon={<TrendingUp size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('progressAnalytics.title')}
        title={formatPercent(data?.summary.avgAccuracy ?? 0)}
        stats={[
          { label: t('progressAnalytics.attempts'), value: formatNumber(data?.summary.totalAttempts ?? 0) },
          { label: t('progressAnalytics.avgAccuracy'), value: formatPercent(data?.summary.avgAccuracy ?? 0) },
          { label: t('progressAnalytics.studyHours'), value: formatNumber(data?.summary.totalStudyHours ?? 0) },
        ]}
      />

      <View style={styles.section}>
        <SectionTitle title={t('progressAnalytics.accuracyTrend')} />
        <Card>
          {accuracyChart.length > 0 ? (
            <LineChart
              data={accuracyChart}
              variant="primary"
              height={160}
              formatValue={(value) => formatPercent(value)}
            />
          ) : (
            <Text style={styles.emptyChart}>{t('progressAnalytics.noAttempts')}</Text>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle title={t('progressAnalytics.subjectMastery')} />
          <BarChart2 size={18} color={theme.colors.text.tertiary} />
        </View>
        <Card style={styles.masteryCard}>
          {(data?.subjectMastery ?? []).length > 0 ? (
            data!.subjectMastery.map((item) => (
              <MasteryRow
                key={item.subject}
                subject={item.subject}
                mastery={item.mastery}
                delta={item.delta}
                attempts={item.attempts}
              />
            ))
          ) : (
            <Text style={styles.emptyChart}>{t('progressAnalytics.buildMastery')}</Text>
          )}
        </Card>
      </View>
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
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    emptyChart: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.xl,
    },
    lockedCard: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing['2xl'],
    },
    lockedTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    lockedBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    masteryCard: {
      gap: theme.spacing.lg,
    },
    masteryRow: {
      gap: theme.spacing.xs,
    },
    masteryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    masterySubject: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    masteryDelta: {
      ...theme.typography.presets.label,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    deltaUp: {
      color: theme.colors.semantic.success,
    },
    deltaDown: {
      color: theme.colors.semantic.error,
    },
    masteryMeta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
    },
  });
}

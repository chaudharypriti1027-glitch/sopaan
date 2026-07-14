import { BarChart2, TrendingUp } from 'lucide-react-native';
import { memo, useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  FeatureScreenLayout,
  LineChart,
  PremiumHeroCard,
  PremiumSectionLabel,
  ProgressBar,
  SegTabs,
} from '../../components';
import type { AnalyticsRange } from '../../api/analytics';
import { useAnalyticsProgress, useProGate } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { useScreenPerf } from '../../perf';
import { useTheme } from '../../theme';
import type { MainStackParamList } from '../../navigation/types';

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
  const route = useRoute<RouteProp<MainStackParamList, 'ProgressAnalytics'>>();
  const { t } = useTranslation('app');
  const { formatNumber, formatPercent } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [range, setRange] = useState<AnalyticsRange>('week');
  const { isPro, openPaywall } = useProGate();

  useEffect(() => {
    if (route.params?.weekKey) {
      setRange('week');
    }
  }, [route.params?.weekKey]);

  const rangeOptions = useMemo(
    () => [
      { key: 'week' as const, label: t('progressAnalytics.rangeWeek') },
      { key: 'month' as const, label: t('progressAnalytics.rangeMonth') },
      { key: 'all' as const, label: t('progressAnalytics.rangeAll') },
    ],
    [t],
  );

  const weekKey = route.params?.weekKey;
  const analyticsQuery = useAnalyticsProgress(range, isPro, weekKey);
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
      <FeatureScreenLayout
        title={t('progressAnalytics.title')}
        subtitle={t('progressAnalytics.proFeature')}
        contentStyle={styles.content}
      >
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
      </FeatureScreenLayout>
    );
  }

  if (analyticsQuery.isLoading && !data) {
    return (
      <FeatureScreenLayout
        title={t('progressAnalytics.title')}
        subtitle={t('progressAnalytics.subtitle')}
        contentStyle={styles.centered}
      >
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('progressAnalytics.title')}
      subtitle={t('progressAnalytics.subtitle')}
      contentStyle={styles.content}
    >

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
        <PremiumSectionLabel title={t('progressAnalytics.accuracyTrend')} compact />
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
          <PremiumSectionLabel title={t('progressAnalytics.subjectMastery')} compact />
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
    </FeatureScreenLayout>
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
      minHeight: 240,
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

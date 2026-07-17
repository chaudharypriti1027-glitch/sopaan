import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  AIGoldCard,
  Button,
  ComparisonBars,
  FeatureScreenLayout,
  PremiumFeatureCard,
  SectionTitle,
  TextField,
  type ComparisonMetric,
} from '../../components';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import {
  useCreatePhysicalLog,
  usePhysicalFitnessPlan,
  usePhysicalLogs,
  useProfile,
} from '../../hooks';
import { useTheme } from '../../theme';

export function PhysicalTestScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const goal = profileQuery.data?.profile?.goal?.examTrack;

  const planQuery = usePhysicalFitnessPlan(goal);
  const logsQuery = usePhysicalLogs({ limit: 10 });
  const createLog = useCreatePhysicalLog();

  const [testType, setTestType] = useState('1.6km_run');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('min');

  const comparisons = planQuery.data?.standards ?? [];
  const planTips = planQuery.data?.plan ?? [];

  const metrics: ComparisonMetric[] = comparisons.map((row) => {
    const target =
      row.targetMax != null ? row.targetMax : row.targetMin != null ? row.targetMin : 0;
    const you = row.latest?.value ?? 0;
    return {
      label: row.label,
      you,
      topper: target,
      average: target * 0.85,
      unit: row.unit ? ` ${row.unit}` : '',
    };
  });

  const handleLog = () => {
    const num = Number(value);
    if (!num || num <= 0) {
      Alert.alert(t('physicalTest.invalidValue'), t('physicalTest.invalidValueBody'));
      return;
    }
    createLog.mutate(
      { testType, value: num, unit },
      {
        onSuccess: () => {
          setValue('');
          Alert.alert(t('physicalTest.logged'), t('physicalTest.loggedBody'));
        },
        onError: (err) => Alert.alert(t('physicalTest.logFailed'), getUserFacingMessage(err)),
      },
    );
  };

  const loading = planQuery.isLoading || profileQuery.isLoading;

  return (
    <FeatureScreenLayout
      title={t('physicalTest.title')}
      subtitle={
        goal ? t('physicalTest.subtitleWithGoal', { goal }) : t('physicalTest.subtitleDefault')
      }
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <>
          {metrics.length > 0 ? (
            <PremiumFeatureCard style={styles.card}>
              <Text style={styles.cardTitle}>{t('physicalTest.progressTitle')}</Text>
              <ComparisonBars metrics={metrics} />
            </PremiumFeatureCard>
          ) : null}

          {planTips.length > 0 ? (
            <AIGoldCard style={styles.card}>
              <AIBadge label={t('physicalTest.fitnessPlan')} />
              {planTips.map((tip, i) => (
                <Text key={i} style={styles.tip}>
                  • {tip}
                </Text>
              ))}
            </AIGoldCard>
          ) : null}
        </>
      )}

      <PremiumFeatureCard style={styles.card}>
        <Text style={styles.cardTitle}>{t('physicalTest.logResult')}</Text>
        <TextField
          label={t('physicalTest.testType')}
          value={testType}
          onChangeText={setTestType}
          placeholder={t('physicalTest.testTypePlaceholder')}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label={t('physicalTest.value')}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={t('physicalTest.valuePlaceholder')}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label={t('physicalTest.unit')}
              value={unit}
              onChangeText={setUnit}
              placeholder={t('physicalTest.unitPlaceholder')}
            />
          </View>
        </View>
        <Button
          label={t('physicalTest.saveLog')}
          onPress={handleLog}
          loading={createLog.isPending}
          fullWidth
        />
      </PremiumFeatureCard>

      <SectionTitle title={t('physicalTest.recentLogs')} />
      {logsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <View style={styles.logList}>
          {(logsQuery.data?.items ?? []).map((log) => (
            <PremiumFeatureCard key={log.id} style={styles.logCard}>
              <Text style={styles.logType}>{log.testType.replace(/_/g, ' ')}</Text>
              <Text style={styles.logValue}>
                {log.value} {log.unit}
              </Text>
              <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString('en-IN')}</Text>
            </PremiumFeatureCard>
          ))}
          {(logsQuery.data?.items ?? []).length === 0 ? (
            <Text style={styles.empty}>{t('physicalTest.empty')}</Text>
          ) : null}
        </View>
      )}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: { gap: theme.spacing.md },
    cardTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    tip: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
    logList: { gap: theme.spacing.sm },
    logCard: { gap: theme.spacing.xs },
    logType: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textTransform: 'capitalize',
    },
    logValue: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.stat.semibold,
      color: theme.colors.text.primary,
    },
    logDate: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}

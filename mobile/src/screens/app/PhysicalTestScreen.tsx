import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  AIBadge,
  AIGoldCard,
  Button,
  Card,
  ComparisonBars,
  Screen,
  SectionTitle,
  TextField,
  type ComparisonMetric,
} from '../../components';
import {
  useCreatePhysicalLog,
  usePhysicalFitnessPlan,
  usePhysicalLogs,
  useProfile,
} from '../../hooks';
import { useTheme } from '../../theme';

export function PhysicalTestScreen() {
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
      Alert.alert('Invalid value', 'Enter a positive number for your test result.');
      return;
    }
    createLog.mutate(
      { testType, value: num, unit },
      {
        onSuccess: () => {
          setValue('');
          Alert.alert('Logged', 'Physical test result saved.');
        },
        onError: (err) => Alert.alert('Could not log', String(err)),
      },
    );
  };

  const loading = planQuery.isLoading || profileQuery.isLoading;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Physical Test"
        subtitle={goal ? `Standards for ${goal}` : 'Police / Defence fitness standards vs your logs'}
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <>
          {metrics.length > 0 ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Your progress vs standard</Text>
              <ComparisonBars metrics={metrics} />
            </Card>
          ) : null}

          {planTips.length > 0 ? (
            <AIGoldCard style={styles.card}>
              <AIBadge label="AI fitness plan" />
              {planTips.map((tip, i) => (
                <Text key={i} style={styles.tip}>
                  • {tip}
                </Text>
              ))}
            </AIGoldCard>
          ) : null}
        </>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Log a result</Text>
        <TextField label="Test type" value={testType} onChangeText={setTestType} placeholder="1.6km_run" />
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="Value"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="7.5"
            />
          </View>
          <View style={styles.half}>
            <TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="min / m / count" />
          </View>
        </View>
        <Button label="Save log" onPress={handleLog} loading={createLog.isPending} fullWidth />
      </Card>

      <Text style={styles.sectionLabel}>Recent logs</Text>
      {logsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <View style={styles.logList}>
          {(logsQuery.data?.items ?? []).map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <Text style={styles.logType}>{log.testType.replace(/_/g, ' ')}</Text>
              <Text style={styles.logValue}>
                {log.value} {log.unit}
              </Text>
              <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString('en-IN')}</Text>
            </Card>
          ))}
          {(logsQuery.data?.items ?? []).length === 0 ? (
            <Text style={styles.empty}>No logs yet — record your first attempt above.</Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    card: { gap: theme.spacing.md },
    cardTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    tip: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
    sectionLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    logList: { gap: theme.spacing.sm },
    logCard: { gap: theme.spacing.xs },
    logType: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary, textTransform: 'capitalize' },
    logValue: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.stat.semibold,
      color: theme.colors.text.primary,
    },
    logDate: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}

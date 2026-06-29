import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type ComparisonMetric = {
  label: string;
  you: number;
  topper: number;
  average: number;
  unit?: string;
};

type ComparisonBarsProps = {
  metrics: ComparisonMetric[];
  style?: ViewStyle;
};

const LEGEND = [
  { key: 'you' as const, label: 'You' },
  { key: 'topper' as const, label: 'Topper' },
  { key: 'average' as const, label: 'Avg' },
];

export function ComparisonBars({ metrics, style }: ComparisonBarsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const colors = {
    you: theme.colors.brand.primary,
    topper: theme.colors.semantic.success,
    average: theme.colors.semantic.warning,
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors[item.key] }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {metrics.map((metric) => {
        const max = Math.max(metric.you, metric.topper, metric.average, 1);
        const unit = metric.unit ?? '';

        return (
          <View key={metric.label} style={styles.metricBlock}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            {LEGEND.map((item) => {
              const value = metric[item.key];

              return (
                <View key={item.key} style={styles.row}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        { flex: value, backgroundColor: colors[item.key] },
                      ]}
                    />
                    <View style={{ flex: max - value }} />
                  </View>
                  <Text style={styles.value}>
                    {value}
                    {unit}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    legend: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    metricBlock: {
      gap: theme.spacing.xs,
    },
    metricLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    rowLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      width: 44,
    },
    track: {
      flex: 1,
      height: 8,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.surface.muted,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    fill: {
      height: '100%',
      borderRadius: theme.radii.full,
    },
    value: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      width: 48,
      textAlign: 'right',
    },
  });
}

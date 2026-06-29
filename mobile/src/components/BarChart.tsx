import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { summarizeChartPoints } from '../a11y/chartSummary';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { getAccentColors, type AccentVariant } from './utils/variants';

export type BarChartDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartDatum[];
  variant?: AccentVariant;
  height?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  formatValue?: (value: number) => string;
};

export function BarChart({
  data,
  variant = 'primary',
  height = 160,
  style,
  accessibilityLabel,
  formatValue,
}: BarChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = getAccentColors(theme, variant);
  const [chartWidth, setChartWidth] = useState(0);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barGap = theme.spacing.sm;
  const barWidth = data.length > 0 ? (chartWidth - barGap * (data.length - 1)) / data.length : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  const resolvedA11yLabel =
    accessibilityLabel ?? summarizeChartPoints(data, formatValue);

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={resolvedA11yLabel}
    >
      <Svg width={chartWidth} height={height} importantForAccessibility="no-hide-descendants">
        {data.map((datum, index) => {
          const barHeight = (datum.value / maxValue) * (height - 24);
          const x = index * (barWidth + barGap);
          const y = height - barHeight - 20;

          return (
            <Rect
              key={datum.label}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={theme.radii.sm}
              fill={accent.main}
            />
          );
        })}
      </Svg>
      <View style={styles.labels} importantForAccessibility="no-hide-descendants">
        {data.map((datum) => (
          <Text key={datum.label} {...denseTextProps} style={styles.label} numberOfLines={1}>
            {datum.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    label: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
      flex: 1,
      textAlign: 'center',
    },
  });
}

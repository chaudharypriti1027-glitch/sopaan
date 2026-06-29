import { memo, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { summarizeChartPoints } from '../a11y/chartSummary';
import { useTheme } from '../theme';
import { getAccentColors, type AccentVariant } from './utils/variants';

export type LineChartDatum = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: LineChartDatum[];
  variant?: AccentVariant;
  height?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  formatValue?: (value: number) => string;
};

function LineChartComponent({
  data,
  variant = 'teal',
  height = 140,
  style,
  accessibilityLabel,
  formatValue,
}: LineChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = getAccentColors(theme, variant);
  const [chartWidth, setChartWidth] = useState(0);

  const padding = theme.spacing.md;
  const innerHeight = height - padding * 2;
  const innerWidth = Math.max(chartWidth - padding * 2, 0);

  const { linePath, points } = useMemo(() => {
    if (data.length === 0 || innerWidth <= 0) {
      return { linePath: '', points: [] as { x: number; y: number }[] };
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const minValue = Math.min(...data.map((d) => d.value), 0);
    const range = maxValue - minValue || 1;

    const nextPoints = data.map((datum, index) => {
      const x =
        padding +
        (data.length <= 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
      const y = padding + innerHeight - ((datum.value - minValue) / range) * innerHeight;
      return { x, y };
    });

    const path =
      nextPoints.length > 0
        ? nextPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        : '';

    return { linePath: path, points: nextPoints };
  }, [data, innerHeight, innerWidth, padding]);

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
        {linePath ? (
          <Path d={linePath} stroke={accent.main} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : null}
        {points.map((point, index) => (
          <Circle
            key={`${data[index]?.label ?? index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={accent.main}
          />
        ))}
      </Svg>
    </View>
  );
}

export const LineChart = memo(LineChartComponent);

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surface.muted,
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
    },
  });
}

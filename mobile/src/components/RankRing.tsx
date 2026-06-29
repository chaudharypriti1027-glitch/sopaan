import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { formatRingSummary } from '../a11y/chartSummary';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { getAccentColors, type AccentVariant } from './utils/variants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RankRingProps = {
  value: number;
  max?: number;
  label?: string;
  /** Overrides the numeric value shown in the ring center (stroke still uses `value`). */
  displayValue?: string | number;
  size?: number;
  strokeWidth?: number;
  variant?: AccentVariant;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function RankRing({
  value,
  max = 100,
  label,
  displayValue,
  size = 120,
  strokeWidth = 10,
  variant = 'primary',
  style,
  accessibilityLabel,
}: RankRingProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const accent = getAccentColors(theme, variant);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = Math.min(Math.max(value / max, 0), 1);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const resolvedA11yLabel = accessibilityLabel ?? formatRingSummary(label, value, max);

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedA11yLabel}
      accessibilityValue={{ min: 0, max: Math.round(max), now: Math.round(value) }}
    >
      <Svg width={size} height={size} style={styles.svg} importantForAccessibility="no-hide-descendants">
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border.subtle}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation="-90" originX={size / 2} originY={size / 2}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accent.main}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={styles.center} importantForAccessibility="no-hide-descendants">
        <Text {...scalableTextProps} style={styles.value}>
          {displayValue ?? Math.round(value)}
        </Text>
        {label ? (
          <Text {...scalableTextProps} style={styles.label}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], size: number) {
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    svg: {
      position: 'absolute',
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    value: {
      ...theme.typography.presets.statLarge,
      fontSize: theme.typography.scale.fontSize['3xl'],
      color: theme.colors.text.primary,
    },
    label: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
  });
}

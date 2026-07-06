import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { formatRingSummary } from '../a11y/chartSummary';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { noHideDescendantsA11y } from '../utils/nativeA11y';
import { getAccentColors, type AccentVariant } from './utils/variants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RankRingProps = {
  value: number;
  max?: number;
  label?: string;
  /** Overrides the numeric value shown in the ring center (stroke still uses `value`). */
  displayValue?: string | number;
  /** When true, only the ring stroke is shown (no center value/label). */
  hideCenter?: boolean;
  size?: number;
  strokeWidth?: number;
  variant?: AccentVariant;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Overrides the unfilled track color — useful on dark/gradient backgrounds. */
  trackColor?: string;
  /** Overrides the filled progress + value text color — useful on dark/gradient backgrounds. */
  accentColor?: string;
  /** Overrides the label text color — useful on dark/gradient backgrounds. */
  labelColor?: string;
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
  trackColor,
  accentColor,
  labelColor,
  hideCenter = false,
}: RankRingProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, size, accentColor, labelColor),
    [theme, size, accentColor, labelColor],
  );
  const accent = getAccentColors(theme, variant);
  const resolvedTrack = trackColor ?? theme.colors.border.subtle;
  const resolvedAccent = accentColor ?? accent.main;

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
      <Svg width={size} height={size} style={styles.svg} {...noHideDescendantsA11y()}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedAccent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {hideCenter ? null : (
        <View style={styles.center} {...noHideDescendantsA11y()}>
          <Text {...scalableTextProps} style={styles.value}>
            {displayValue ?? Math.round(value)}
          </Text>
          {label ? (
            <Text {...scalableTextProps} style={styles.label}>
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  size: number,
  accentColor?: string,
  labelColor?: string,
) {
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
      color: accentColor ?? theme.colors.text.primary,
    },
    label: {
      ...theme.typography.presets.caption,
      color: labelColor ?? theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
  });
}

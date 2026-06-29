import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { formatProgressSummary } from '../a11y/chartSummary';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { getAccentColors, type AccentVariant } from './utils/variants';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: AccentVariant;
  height?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'primary',
  height = 8,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, height), [theme, height]);
  const accent = getAccentColors(theme, variant);
  const target = Math.min(Math.max(value / max, 0), 1);
  const percent = Math.round(target * 100);

  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [target, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const resolvedA11yLabel =
    accessibilityLabel ?? formatProgressSummary(label, value, max);

  return (
    <View style={[styles.container, style]}>
      {(label || showValue) && (
        <View style={styles.header} importantForAccessibility="no-hide-descendants">
          {label ? (
            <Text {...scalableTextProps} style={styles.label}>
              {label}
            </Text>
          ) : (
            <View />
          )}
          {showValue ? (
            <Text {...scalableTextProps} style={styles.value}>
              {percent}%
            </Text>
          ) : null}
        </View>
      )}
      <View
        style={styles.track}
        onLayout={onTrackLayout}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={resolvedA11yLabel}
        accessibilityValue={{ min: 0, max: Math.round(max), now: Math.round(value) }}
      >
        <Animated.View
          style={[styles.fill, { backgroundColor: accent.main }, fillStyle]}
          importantForAccessibility="no"
        />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], height: number) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    value: {
      ...theme.typography.presets.stat,
      color: theme.colors.text.secondary,
    },
    track: {
      height,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.border.subtle,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: theme.radii.full,
    },
  });
}

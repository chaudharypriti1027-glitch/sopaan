import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type TimerRingProps = {
  totalSec: number;
  remainingSec: number;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TimerRing({
  totalSec,
  remainingSec,
  size = 56,
  strokeWidth = 5,
  style,
  accessibilityLabel,
}: TimerRingProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(totalSec > 0 ? remainingSec / totalSec : 0);

  const displayBucket = Math.floor(remainingSec / 5);

  useEffect(() => {
    animatedProgress.value = withTiming(totalSec > 0 ? remainingSec / totalSec : 0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [displayBucket, totalSec, remainingSec, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const urgent = remainingSec <= 60;
  const timeLabel = formatTime(remainingSec);
  const resolvedA11yLabel = accessibilityLabel ?? `Time remaining, ${timeLabel}`;

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={resolvedA11yLabel}
      accessibilityLiveRegion="polite"
    >
      <Svg width={size} height={size} importantForAccessibility="no-hide-descendants">
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
            stroke={urgent ? theme.colors.semantic.error : theme.colors.brand.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <Text
        {...denseTextProps}
        style={[styles.time, urgent && styles.timeUrgent]}
        importantForAccessibility="no"
      >
        {timeLabel}
      </Text>
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
    time: {
      ...theme.typography.presets.label,
      fontFamily: theme.typography.fonts.stat.semibold,
      color: theme.colors.text.primary,
      position: 'absolute',
    },
    timeUrgent: {
      color: theme.colors.semantic.error,
    },
  });
}

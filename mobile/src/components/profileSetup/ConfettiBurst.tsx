import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 18;

type ConfettiBurstProps = {
  active: boolean;
};

/** Lightweight confetti burst for onboarding success. */
export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const { theme } = useTheme();
  const colors = useMemo(
    () => [
      theme.colors.brand.primary,
      theme.colors.accent.gold,
      theme.colors.accent.teal,
      theme.colors.accent.coral,
    ],
    [theme],
  );

  if (!active) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
        <ConfettiParticle
          key={`confetti-${index}`}
          color={colors[index % colors.length]}
          index={index}
        />
      ))}
    </View>
  );
}

function ConfettiParticle({ color, index }: { color: string; index: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  const startX = (index / PARTICLE_COUNT) * SCREEN_WIDTH;
  const drift = ((index % 5) - 2) * 36;

  useEffect(() => {
    translateX.value = withDelay(
      index * 20,
      withTiming(drift, { duration: 900, easing: Easing.out(Easing.quad) }),
    );
    translateY.value = withDelay(
      index * 15,
      withTiming(SCREEN_HEIGHT * 0.45, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    rotate.value = withTiming(360, { duration: 1100 });
    opacity.value = withDelay(700, withTiming(0, { duration: 400 }));
  }, [drift, index, opacity, rotate, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: SCREEN_HEIGHT * 0.22,
          left: startX,
          width: 8,
          height: 12,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

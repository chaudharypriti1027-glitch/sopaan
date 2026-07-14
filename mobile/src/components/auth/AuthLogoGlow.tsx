import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type AuthLogoGlowProps = {
  size?: number;
};

export function AuthLogoGlow({ size = 88 }: AuthLogoGlowProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.28);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.28, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity, reducedMotion, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginTop: -(size - 70) / 2,
          marginBottom: -(size - 70) / 2,
        },
        glowStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(227,201,127,0.35)',
    shadowColor: '#E3C97F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 6,
  },
});

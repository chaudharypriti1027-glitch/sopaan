import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type TestReadyPulseOrbProps = {
  size?: number;
};

export function TestReadyPulseOrb({ size = 112 }: TestReadyPulseOrbProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.32);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 950, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: 950, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.32, { duration: 950, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [glow, scale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2 },
        orbStyle,
      ]}
    >
      <LinearGradient
        colors={['#F0D48A', '#C29A4E', '#A67C33']}
        style={[styles.fill, { borderRadius: size / 2 }]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
  fill: {
    flex: 1,
  },
});

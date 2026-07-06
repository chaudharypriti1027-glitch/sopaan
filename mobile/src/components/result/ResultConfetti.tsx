import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { RESULT_UI } from './resultTheme';

const COLORS = [RESULT_UI.gold, RESULT_UI.goldLt, RESULT_UI.sage, '#FFFFFF', '#3A4680'];
const COUNT = 22;

type ResultConfettiProps = {
  active?: boolean;
};

export function ResultConfetti({ active = true }: ResultConfettiProps) {
  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: COUNT }).map((_, index) => (
        <ConfettiPiece key={index} index={index} color={COLORS[index % COLORS.length]} />
      ))}
    </View>
  );
}

function ConfettiPiece({ index, color }: { index: number; color: string }) {
  const translateY = useSharedValue(-10);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const left = useMemo(() => (index / COUNT) * 100, [index]);

  useEffect(() => {
    const delay = (index % 8) * 80;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(360, { duration: 2400 + (index % 5) * 200, easing: Easing.out(Easing.quad) }),
    );
    rotate.value = withDelay(delay, withTiming(320, { duration: 2600 }));
    opacity.value = withDelay(delay + 1800, withTiming(0, { duration: 600 }));
  }, [index, opacity, rotate, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: `${left}%` as `${number}%`, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  piece: {
    position: 'absolute',
    top: -12,
    width: 7,
    height: 11,
    borderRadius: 2,
  },
});

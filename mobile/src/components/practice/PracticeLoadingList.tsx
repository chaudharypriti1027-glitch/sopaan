import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PRACTICE_UI } from './practiceTheme';
import { practiceFadeInDown } from './practiceMotion';

function SkeletonRow({ index }: { index: number }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View entering={practiceFadeInDown(index, 40, 300)} style={styles.row}>
      <Animated.View style={[styles.avatar, pulseStyle]} />
      <View style={styles.lines}>
        <Animated.View style={[styles.lineLg, pulseStyle]} />
        <Animated.View style={[styles.lineSm, pulseStyle]} />
      </View>
      <Animated.View style={[styles.btn, pulseStyle]} />
    </Animated.View>
  );
}

type PracticeLoadingListProps = {
  rows?: number;
};

export function PracticeLoadingList({ rows = 3 }: PracticeLoadingListProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
      style={styles.wrap}
      testID="practice-loading-list"
    >
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonRow key={index} index={index} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: PRACTICE_UI.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(35,42,77,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#E8EBF5',
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  lineLg: {
    height: 12,
    width: '72%',
    borderRadius: 6,
    backgroundColor: '#E8EBF5',
  },
  lineSm: {
    height: 10,
    width: '48%',
    borderRadius: 5,
    backgroundColor: '#EEF1FA',
  },
  btn: {
    width: 56,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E0E4F2',
  },
});

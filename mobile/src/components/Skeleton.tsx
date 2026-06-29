import { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Shimmer placeholder — uses surface + muted tokens only. */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);
  const radius = borderRadius ?? theme.radii.md;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.surface.muted,
          overflow: 'hidden',
        },
        shimmer: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.colors.surface.default,
          opacity: 0.45,
        },
      }),
    [theme, width, height, radius],
  );

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-120, 120]),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.2, 0.55, 0.2]),
  }));

  return (
    <View style={[styles.track, style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

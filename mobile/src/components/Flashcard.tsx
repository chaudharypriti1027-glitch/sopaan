import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

type FlashcardProps = {
  front: string;
  back: string;
  flipped?: boolean;
  onFlip?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  flipHint?: string;
};

export function Flashcard({
  front,
  back,
  flipped = false,
  onFlip,
  style,
  accessibilityLabel,
  flipHint = 'Double tap to flip flashcard',
}: FlashcardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rotation = useSharedValue(flipped ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(flipped ? 180 : 0, { duration: 400 });
  }, [flipped, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
    opacity: interpolate(rotation.value, [0, 89, 90, 180], [1, 1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value + 180}deg` }],
    opacity: interpolate(rotation.value, [0, 89, 90, 180], [0, 0, 1, 1]),
  }));

  const resolvedLabel =
    accessibilityLabel ??
    (flipped ? `Answer: ${back}` : `Question: ${front}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityHint={flipHint}
      onPress={onFlip}
      style={[styles.wrapper, style]}
    >
      <Animated.View style={[styles.face, styles.front, frontStyle]}>
        <Text {...scalableTextProps} style={styles.label}>
          Question
        </Text>
        <Text {...scalableTextProps} style={styles.text}>
          {front}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.face, styles.back, backStyle]}>
        <Text {...scalableTextProps} style={styles.label}>
          Answer
        </Text>
        <Text {...scalableTextProps} style={styles.text}>
          {back}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const height = 200;

  return StyleSheet.create({
    wrapper: {
      height,
      position: 'relative',
      minHeight: theme.a11y.minTouchTarget,
    },
    face: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.radii.card,
      padding: theme.spacing.xl,
      justifyContent: 'center',
      backfaceVisibility: 'hidden',
      ...theme.shadows.card,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    front: {},
    back: {},
    label: {
      ...theme.typography.presets.eyebrow,
      color: theme.colors.brand.primary,
      marginBottom: theme.spacing.sm,
    },
    text: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
  });
}

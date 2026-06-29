import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_UI } from './authTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  testID,
  accessibilityHint,
}: PrimaryButtonProps) {
  const styles = useMemo(() => createStyles(), []);
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.99, { damping: 18, stiffness: 420 });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 360 });
  };

  const resolvedTestId =
    testID ?? `primary-button-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={resolvedTestId}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[fullWidth && styles.fullWidth, animatedStyle, style]}
    >
      {isDisabled && !loading ? (
        <View style={[styles.button, styles.disabled]}>
          <Text {...scalableTextProps} style={styles.disabledLabel}>
            {label}
          </Text>
        </View>
      ) : (
        <LinearGradient
          colors={isDisabled ? ['#E2E8F0', '#E2E8F0'] : [...AUTH_UI.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text {...scalableTextProps} style={styles.label}>
              {label}
            </Text>
          )}
        </LinearGradient>
      )}
    </AnimatedPressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    fullWidth: {
      alignSelf: 'stretch',
    },
    button: {
      minHeight: 48,
      borderRadius: AUTH_UI.btnRadius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 16,
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    disabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: '#FFFFFF',
    },
    disabledLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: AUTH_UI.faint,
    },
  });
}

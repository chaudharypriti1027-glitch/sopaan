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
import type { LucideIcon } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

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
  trailingIcon?: LucideIcon;
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
  trailingIcon: TrailingIcon,
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
          <View style={styles.content}>
            <Text {...scalableTextProps} style={styles.disabledLabel}>
              {label}
            </Text>
            {TrailingIcon ? <TrailingIcon size={17} color={AUTH_UI.muted} strokeWidth={2.3} /> : null}
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={
            isDisabled
              ? ['#E8E4DA', '#E8E4DA']
              : ['#F0DFA8', '#E3C97F', '#C29A4E']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={AUTH_UI.accentDark} size="small" />
          ) : (
            <View style={styles.content}>
              <Text {...scalableTextProps} style={[styles.label, isDisabled && styles.disabledLabel]}>
                {label}
              </Text>
              {TrailingIcon ? (
                <TrailingIcon size={17} color="#2A2110" strokeWidth={2.3} />
              ) : null}
            </View>
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
      minHeight: 52,
      borderRadius: AUTH_UI.btnRadius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      shadowColor: AUTH_UI.goldDeep,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    disabled: {
      backgroundColor: AUTH_UI.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    label: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 15,
      letterSpacing: 0.2,
      color: '#2A2110',
    },
    disabledLabel: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 14,
      color: AUTH_UI.muted,
    },
  });
}

import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../theme';

export type QuizOptionState = 'default' | 'selected' | 'correct' | 'wrong';

type QuizOptionProps = {
  label: string;
  indexLabel?: string;
  state?: QuizOptionState;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export const QuizOption = memo(function QuizOption({
  label,
  indexLabel,
  state = 'default',
  onPress,
  disabled = false,
  style,
  testID,
}: QuizOptionProps) {
  const { theme } = useTheme();
  const { styles, iconColor } = useMemo(() => createStyles(theme, state), [theme, state]);
  const resolvedTestId = testID ?? (indexLabel ? `quiz-option-${indexLabel.toLowerCase()}` : undefined);

  const showCheck = state === 'selected' || state === 'correct';
  const showX = state === 'wrong';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected' || state === 'correct' }}
      accessibilityLabel={indexLabel ? `Option ${indexLabel}` : label}
      testID={resolvedTestId}
      onPress={onPress}
      disabled={disabled || state === 'correct' || state === 'wrong'}
      style={({ pressed }) => [styles.option, pressed && !disabled && styles.pressed, style]}
    >
      {indexLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{indexLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      {showCheck ? <Check size={18} color={iconColor} strokeWidth={2.5} /> : null}
      {showX ? <X size={18} color={iconColor} strokeWidth={2.5} /> : null}
    </Pressable>
  );
});

function createStyles(theme: ReturnType<typeof useTheme>['theme'], state: QuizOptionState) {
  const palette = {
    default: {
      background: theme.colors.surface.default,
      border: theme.colors.border.default,
      label: theme.colors.text.primary,
      badgeBg: theme.colors.surface.muted,
      badgeText: theme.colors.text.secondary,
      icon: theme.colors.brand.primary,
    },
    selected: {
      background: theme.colors.brand.primaryMuted,
      border: theme.colors.brand.primary,
      label: theme.colors.brand.primary,
      badgeBg: theme.colors.brand.primary,
      badgeText: theme.colors.brand.onPrimary,
      icon: theme.colors.brand.primary,
    },
    correct: {
      background: theme.colors.semantic.successMuted,
      border: theme.colors.semantic.success,
      label: theme.colors.text.primary,
      badgeBg: theme.colors.semantic.success,
      badgeText: theme.colors.brand.onPrimary,
      icon: theme.colors.semantic.success,
    },
    wrong: {
      background: theme.colors.semantic.errorMuted,
      border: theme.colors.semantic.error,
      label: theme.colors.text.primary,
      badgeBg: theme.colors.semantic.error,
      badgeText: theme.colors.brand.onPrimary,
      icon: theme.colors.semantic.error,
    },
  }[state];

  return {
    iconColor: palette.icon,
    styles: StyleSheet.create({
      option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radii.button,
        backgroundColor: palette.background,
        borderWidth: 1.5,
        borderColor: palette.border,
      },
      pressed: {
        opacity: 0.92,
      },
      badge: {
        width: 28,
        height: 28,
        borderRadius: theme.radii.md,
        backgroundColor: palette.badgeBg,
        alignItems: 'center',
        justifyContent: 'center',
      },
      badgeText: {
        ...theme.typography.presets.label,
        color: palette.badgeText,
      },
      label: {
        ...theme.typography.presets.body,
        color: palette.label,
        flex: 1,
      },
    }),
  };
}

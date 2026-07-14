import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { AUTH_UI } from '../auth/authTheme';
import { Text } from '../Text';
import { useTheme } from '../../theme';

type ExamOptionCardProps = {
  label: string;
  description?: string;
  selected?: boolean;
  icon: ReactNode;
  onPress?: PressableProps['onPress'];
  style?: ViewStyle;
  testID?: string;
};

export function ExamOptionCard({
  label,
  description,
  selected = false,
  icon,
  onPress,
  style,
  testID,
}: ExamOptionCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, selected), [theme, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}, ${description}` : label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.copy}>
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="secondary" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], selected: boolean) {
  return StyleSheet.create({
    card: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      minHeight: 96,
      borderRadius: theme.radii.lg,
      borderWidth: 1.5,
      borderColor: selected ? AUTH_UI.accent : AUTH_UI.border,
      backgroundColor: selected ? 'rgba(35,42,77,0.06)' : AUTH_UI.card,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    pressed: {
      opacity: 0.94,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: selected ? AUTH_UI.card : 'rgba(35,42,77,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      width: '100%',
      minWidth: 0,
      gap: 2,
    },
    label: {
      fontFamily: selected
        ? theme.typography.fonts.ui.semibold
        : theme.typography.fonts.ui.medium,
      color: selected ? AUTH_UI.accent : theme.colors.text.primary,
      flexShrink: 1,
    },
    description: {
      flexShrink: 1,
      lineHeight: 16,
    },
  });
}

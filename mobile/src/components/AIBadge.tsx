import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme';

type AIBadgeProps = {
  label?: string;
  style?: ViewStyle;
};

export function AIBadge({ label = 'AI', style }: AIBadgeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.badge, style]}>
      <Sparkles size={12} color={theme.colors.accent.goldOn} strokeWidth={2.5} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.accent.goldMuted,
      borderWidth: 1,
      borderColor: theme.colors.accent.gold,
    },
    label: {
      ...theme.typography.presets.label,
      color: theme.colors.accent.goldOn,
      textTransform: 'uppercase',
    },
  });
}

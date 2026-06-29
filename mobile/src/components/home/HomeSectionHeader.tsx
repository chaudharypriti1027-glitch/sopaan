import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';

type HomeSectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  badge?: ReactNode;
  /** Tighter top spacing directly under the hero card. */
  compact?: boolean;
};

export function HomeSectionHeader({
  title,
  actionLabel,
  onActionPress,
  badge,
  compact = false,
}: HomeSectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.trailing}>
        {badge}
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={onActionPress}
            disabled={!onActionPress}
            hitSlop={8}
            style={({ pressed }) => [styles.actionBtn, pressed && onActionPress && styles.pressed]}
          >
            <Text style={[styles.action, !onActionPress && styles.actionMuted]}>{actionLabel}</Text>
            {onActionPress ? (
              <ChevronRight size={14} color="#4F46E5" strokeWidth={2.2} />
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11,
      marginTop: compact ? 16 : 22,
      paddingHorizontal: 2,
      gap: theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: '#0D0F1A',
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    action: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#4F46E5',
    },
    actionMuted: {
      opacity: 0.55,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    pressed: {
      opacity: 0.85,
    },
  });
}

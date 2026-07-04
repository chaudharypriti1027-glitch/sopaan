import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { GAMES_UI } from './gamesTheme';

type GamesSectionHeaderProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
  /** Tighter top spacing directly under the hero overlap card. */
  compact?: boolean;
};

export function GamesSectionHeader({
  title,
  action,
  onActionPress,
  compact = false,
}: GamesSectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          disabled={!onActionPress}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && onActionPress && styles.pressed]}
        >
          <Text style={[styles.action, !onActionPress && styles.actionMuted]}>{action}</Text>
          {onActionPress ? (
            <ChevronRight size={14} color={GAMES_UI.accent} strokeWidth={2.2} />
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      marginTop: compact ? 16 : 22,
      paddingHorizontal: 2,
      gap: theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 16,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: GAMES_UI.ink,
    },
    action: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: GAMES_UI.accent,
    },
    actionMuted: {
      opacity: 0.55,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      flexShrink: 0,
    },
    pressed: {
      opacity: 0.85,
    },
  });
}

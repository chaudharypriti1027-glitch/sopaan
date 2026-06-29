import { Hand, Heart, ThumbsUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LiveClassReaction } from '../../realtime/events';
import { useTheme } from '../../theme';

type LiveClassReactionsBarProps = {
  onRaiseHand: () => void;
  onReaction: (emoji: string) => void;
  recent?: LiveClassReaction[];
};

const REACTIONS = ['👏', '🔥', '❤️', '🎉'];

export function LiveClassReactionsBar({ onRaiseHand, onReaction, recent = [] }: LiveClassReactionsBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const latestRaise = [...recent].reverse().find((item) => item.kind === 'raise_hand');

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Raise hand" onPress={onRaiseHand} style={styles.raiseBtn}>
        <Hand size={18} color={theme.colors.brand.onPrimary} />
        <Text style={styles.raiseLabel}>Raise hand</Text>
      </Pressable>

      <View style={styles.emojiRow}>
        {REACTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`React ${emoji}`}
            onPress={() => onReaction(emoji)}
            style={styles.emojiBtn}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={() => onReaction('❤️')} style={styles.iconBtn}>
          <Heart size={18} color={theme.colors.semantic.error} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onReaction('👍')} style={styles.iconBtn}>
          <ThumbsUp size={18} color={theme.colors.brand.primary} />
        </Pressable>
      </View>

      {latestRaise ? (
        <Text style={styles.toast} numberOfLines={1}>
          ✋ {latestRaise.userName} raised a hand
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface.default,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    raiseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.lg,
    },
    raiseLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.onPrimary,
    },
    emojiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    emojiBtn: {
      minWidth: 40,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surface.muted,
    },
    emoji: { fontSize: 20 },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surface.muted,
    },
    toast: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}

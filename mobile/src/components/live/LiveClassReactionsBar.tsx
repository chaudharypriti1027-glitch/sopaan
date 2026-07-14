import { Hand } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIVE_REACTION_EMOJIS } from '../../content/liveClassesContent';
import { useTheme } from '../../theme';

type LiveClassReactionsBarProps = {
  handRaised: boolean;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  onReaction: (emoji: string) => void;
};

export function LiveClassReactionsBar({
  handRaised,
  onRaiseHand,
  onLowerHand,
  onReaction,
}: LiveClassReactionsBarProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={handRaised ? t('lowerHand') : t('raiseHand')}
        onPress={handRaised ? onLowerHand : onRaiseHand}
        style={[styles.raiseBtn, handRaised ? styles.raiseBtnActive : null]}
      >
        <Hand size={18} color={theme.colors.brand.onPrimary} />
        <Text style={styles.raiseLabel}>{handRaised ? t('lowerHand') : t('raiseHand')}</Text>
      </Pressable>

      <View style={styles.emojiRow}>
        {LIVE_REACTION_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={t('reactA11y', { emoji })}
            onPress={() => onReaction(emoji)}
            style={styles.emojiBtn}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
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
    raiseBtnActive: {
      backgroundColor: theme.colors.semantic.warning,
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
  });
}

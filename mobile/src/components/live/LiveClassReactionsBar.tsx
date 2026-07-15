import { Hand } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIVE_REACTIONS } from '../../content/liveClassesContent';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

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
        <Hand size={17} color={handRaised ? LIVE.inkPin : '#FFFFFF'} strokeWidth={2.1} />
        <Text style={[styles.raiseLabel, handRaised && styles.raiseLabelActive]}>
          {handRaised ? t('lowerHand') : t('raiseHand')}
        </Text>
      </Pressable>

      <View style={styles.reactRow} testID="live-reactions-bar">
        {LIVE_REACTIONS.map(({ emoji, Icon, labelKey }) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={t('reactA11y', { reaction: t(`reactions.${labelKey}`) })}
            onPress={() => onReaction(emoji)}
            style={styles.reactBtn}
          >
            <Icon size={17} color={LIVE.navy} strokeWidth={2.15} />
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
      backgroundColor: LIVE.listBgTop,
      borderTopWidth: 1,
      borderTopColor: LIVE.border,
    },
    raiseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      backgroundColor: LIVE.navy,
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 44,
    },
    raiseBtnActive: {
      backgroundColor: LIVE.goldLt,
    },
    raiseLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: '#FFFFFF',
    },
    raiseLabelActive: {
      color: LIVE.inkPin,
    },
    reactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    reactBtn: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
    },
  });
}

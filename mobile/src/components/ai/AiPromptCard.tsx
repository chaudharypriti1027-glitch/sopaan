import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '../premium/PremiumIcon';
import type { PremiumIconTone } from '../premium/premiumIconTokens';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI, aiPremiumCard, aiPressFeedback } from './aiTheme';

type AiPromptCardProps = {
  Icon: LucideIcon;
  tone: PremiumIconTone;
  text: string;
  tag: string;
  onPress: () => void;
};

export function AiPromptCard({ Icon, text, tag, tone, onPress }: AiPromptCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && aiPressFeedback]}
    >
      <View style={styles.accent} />
      <PremiumIcon Icon={Icon} tone={tone} size="md" filled />
      <View style={styles.copy}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.tag}>{tag}</Text>
      </View>
      <ChevronRight size={16} color={AI_UI.goldDeep} strokeWidth={2.5} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      ...aiPremiumCard(),
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      overflow: 'hidden',
    },
    accent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: AI_UI.gold,
    },
    copy: {
      flex: 1,
      gap: 3,
    },
    text: {
      fontSize: 14,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: AI_UI.ink,
    },
    tag: {
      fontSize: 10.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
  });
}

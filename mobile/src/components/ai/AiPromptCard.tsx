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
  tag?: string;
  onPress: () => void;
};

export function AiPromptCard({ Icon, text, tone, onPress }: AiPromptCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && aiPressFeedback]}
    >
      <PremiumIcon Icon={Icon} tone={tone} size="sm" filled />
      <Text style={styles.text} numberOfLines={2}>
        {text}
      </Text>
      <ChevronRight size={15} color={AI_UI.goldDeep} strokeWidth={2.4} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      ...aiPremiumCard(),
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
    },
    text: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: AI_UI.ink,
    },
  });
}

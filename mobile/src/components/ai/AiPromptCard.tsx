import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '../premium/PremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiPromptCardProps = {
  Icon: LucideIcon;
  text: string;
  tag: string;
  onPress: () => void;
};

export function AiPromptCard({ Icon, text, tag, onPress }: AiPromptCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PremiumIcon Icon={Icon} tone="lavender" size="md" filled />
      <View style={styles.copy}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.tag}>{tag}</Text>
      </View>
      <ChevronRight size={16} color={AI_UI.primaryMuted} strokeWidth={2.5} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: 20,
      backgroundColor: AI_UI.card,
      borderWidth: 1,
      borderColor: AI_UI.border,
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    pressed: {
      opacity: 0.94,
      borderColor: AI_UI.borderStrong,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    text: {
      fontSize: 14,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: AI_UI.ink,
    },
    tag: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
  });
}

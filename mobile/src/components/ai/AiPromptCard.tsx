import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
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
      <View style={styles.iconBox}>
        <Icon size={19} color={AI_UI.primary} strokeWidth={1.8} />
      </View>
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
      borderRadius: 16,
      backgroundColor: AI_UI.card,
      borderWidth: 1.5,
      borderColor: AI_UI.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    pressed: {
      opacity: 0.94,
      borderColor: 'rgba(79,53,210,0.27)',
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: AI_UI.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    text: {
      fontSize: 13.5,
      lineHeight: 18,
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

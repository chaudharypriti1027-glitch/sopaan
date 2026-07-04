import { SearchX } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PremiumIcon } from '../premium/PremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { homePremiumCard } from '../home/homeStyles';
import { GAMES_UI } from './gamesTheme';

type GamesEmptyStateProps = {
  title: string;
  hint: string;
  actionLabel: string;
  onAction: () => void;
};

export function GamesEmptyState({ title, hint, actionLabel, onAction }: GamesEmptyStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <PremiumIcon Icon={SearchX} tone="slate" size="md" filled />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingVertical: 8,
      paddingBottom: 24,
    },
    card: {
      ...homePremiumCard(theme),
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 24,
      gap: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: GAMES_UI.ink,
      letterSpacing: -0.2,
      marginTop: 4,
      textAlign: 'center',
    },
    hint: {
      fontSize: 12,
      fontWeight: '600',
      color: GAMES_UI.muted,
      textAlign: 'center',
      lineHeight: 17,
      marginBottom: 6,
    },
    btn: {
      marginTop: 4,
      backgroundColor: GAMES_UI.accentSoft,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: GAMES_UI.borderSoft,
    },
    btnPressed: {
      opacity: 0.9,
    },
    btnText: {
      fontSize: 12,
      fontWeight: '800',
      color: GAMES_UI.accent,
    },
  });
}

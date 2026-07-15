import { ChevronLeft, Coins } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GamesScreenHeaderProps = {
  greeting: string;
  title: string;
  coins: number;
  onBack?: () => void;
};

export function GamesScreenHeader({ greeting, title, coins, onBack }: GamesScreenHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color={GAMES_UI.text} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.copy}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.coinPill}>
        <Coins size={14} color={GAMES_UI.gold} strokeWidth={2.2} />
        <Text style={styles.coinValue}>{coins}</Text>
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backSpacer: {
      width: 40,
    },
    copy: {
      flex: 1,
    },
    greeting: {
      fontSize: 12,
      fontWeight: '600',
      color: GAMES_UI.muted,
    },
    title: {
      fontSize: 19,
      fontWeight: '900',
      color: GAMES_UI.text,
      marginTop: 2,
    },
    coinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: GAMES_UI.border,
    },
    coinValue: {
      fontSize: 14,
      fontWeight: '800',
      color: GAMES_UI.gold,
    },
  });
}

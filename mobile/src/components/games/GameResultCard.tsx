import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GameResultCardProps = {
  title: string;
  subtitle: string;
  score: number;
  scoreLabel: string;
  coinsLabel: string;
  coinsValue: string | number;
  coinsLoading?: boolean;
  rewardHint?: string;
  playAgainLabel: string;
  allGamesLabel: string;
  retryLabel?: string;
  showRetry?: boolean;
  retryLoading?: boolean;
  onPlayAgain: () => void;
  onAllGames: () => void;
  onRetry?: () => void;
};

export function GameResultCard({
  title,
  subtitle,
  score,
  scoreLabel,
  coinsLabel,
  coinsValue,
  coinsLoading,
  rewardHint,
  playAgainLabel,
  allGamesLabel,
  retryLabel,
  showRetry,
  retryLoading,
  onPlayAgain,
  onAllGames,
  onRetry,
}: GameResultCardProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[GAMES_UI.accent, GAMES_UI.accent2]}
        style={styles.emojiWrap}
      >
        <Text style={styles.emoji}>🎉</Text>
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <NumText style={styles.statVal}>{score}</NumText>
          <Text style={styles.statLbl}>{scoreLabel}</Text>
        </View>
        <View style={styles.stat}>
          {coinsLoading ? (
            <Text style={styles.statVal}>…</Text>
          ) : (
            <NumText style={[styles.statVal, styles.statGold]}>+{coinsValue}</NumText>
          )}
          <Text style={styles.statLbl}>{coinsLabel}</Text>
        </View>
      </View>

      {rewardHint ? <Text style={styles.hint}>{rewardHint}</Text> : null}

      {showRetry && onRetry && retryLabel ? (
        <Button label={retryLabel} onPress={onRetry} loading={retryLoading} fullWidth />
      ) : null}
      <Button label={playAgainLabel} onPress={onPlayAgain} fullWidth />
      <Button label={allGamesLabel} variant="ghost" onPress={onAllGames} fullWidth />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      padding: 24,
      alignItems: 'center',
      gap: 12,
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 40,
      elevation: 4,
    },
    emojiWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 36 },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    subtitle: {
      fontSize: 14,
      color: GAMES_UI.muted,
      textAlign: 'center',
    },
    stats: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginVertical: 8,
    },
    stat: {
      flex: 1,
      backgroundColor: GAMES_UI.card2,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 4,
    },
    statVal: {
      fontSize: 22,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    statGold: {
      color: GAMES_UI.gold,
    },
    statLbl: {
      fontSize: 10,
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    hint: {
      fontSize: 12,
      color: GAMES_UI.muted,
      textAlign: 'center',
    },
  });
}

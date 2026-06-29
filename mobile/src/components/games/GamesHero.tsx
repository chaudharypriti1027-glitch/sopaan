import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GamesHeroProps = {
  coins: number;
  streak: number;
  gamesDone: number;
  title: string;
  subtitle: string;
  badgeLabel: string;
  streakLabel: string;
  gamesDoneLabel: string;
  rankLabel: string;
};

export function GamesHero({
  coins,
  streak,
  gamesDone,
  title,
  subtitle,
  badgeLabel,
  streakLabel,
  gamesDoneLabel,
  rankLabel,
}: GamesHeroProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[GAMES_UI.accent, '#8B5CF6', GAMES_UI.accent2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeLabel.replace('{{coins}}', String(coins))}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>🔥 {streak}</Text>
          <Text style={styles.statLbl}>{streakLabel}</Text>
        </View>
        <View style={styles.stat}>
          <NumText style={styles.statVal}>{gamesDone}</NumText>
          <Text style={styles.statLbl}>{gamesDoneLabel}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>🏆 —</Text>
          <Text style={styles.statLbl}>{rankLabel}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function createStyles() {
  return StyleSheet.create({
    hero: {
      marginHorizontal: 16,
      borderRadius: 28,
      padding: 24,
      minHeight: 155,
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(255,255,255,0.08)',
      right: -60,
      top: -70,
    },
    decorB: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255,255,255,0.05)',
      right: 30,
      bottom: -50,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      marginBottom: 14,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 6,
    },
    stats: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },
    stat: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 14,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    statVal: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    statLbl: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.65)',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
}

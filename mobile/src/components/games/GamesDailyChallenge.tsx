import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GamesDailyChallengeProps = {
  title: string;
  subtitle: string;
  cta: string;
  progress: number;
  onPress: () => void;
};

export function GamesDailyChallenge({
  title,
  subtitle,
  cta,
  progress,
  onPress,
}: GamesDailyChallengeProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.emoji}>🎯</Text>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
        </View>
      </View>
      <LinearGradient colors={['#F97316', '#FBBF24']} style={styles.cta}>
        <Text style={styles.ctaText}>{cta}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 16,
      backgroundColor: '#FFF7ED',
      borderWidth: 1.5,
      borderColor: 'rgba(249,115,22,0.2)',
      borderRadius: 20,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    pressed: { opacity: 0.94 },
    emoji: { fontSize: 32 },
    copy: { flex: 1, gap: 2 },
    title: { fontSize: 13, fontWeight: '800', color: GAMES_UI.text },
    subtitle: { fontSize: 11, color: GAMES_UI.muted },
    track: {
      height: 5,
      borderRadius: 5,
      backgroundColor: 'rgba(249,115,22,0.15)',
      marginTop: 6,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: '#F97316',
    },
    cta: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    ctaText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}

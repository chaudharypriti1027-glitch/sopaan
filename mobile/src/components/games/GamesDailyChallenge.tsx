import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Target } from 'lucide-react-native';
import { GlassSurface } from '../GlassSurface';
import { PremiumIcon } from '../premium/PremiumIcon';
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
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <GlassSurface tone="gold" intensity={36} borderRadius={20} style={styles.glassWrap}>
        <View style={styles.card}>
          <View style={styles.iconTile}>
            <PremiumIcon Icon={Target} tone="gold" size="md" filled />
          </View>

          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={styles.challengeLabel}>{title}</Text>
              <View style={styles.sparkBadge}>
                <Text style={styles.sparkBadgeText}>
                  <Text style={styles.spark}>✦ </Text>
                  DAILY
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cta}</Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
            <View style={styles.track}>
              <LinearGradient
                colors={['#E3C97F', '#C29A4E']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.fill, { width: `${pct}%` }]}
              />
            </View>
          </View>

          <View style={styles.arrow}>
            <ChevronRight size={18} color={GAMES_UI.goldDeep} strokeWidth={2.2} />
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      borderRadius: 20,
    },
    pressed: { opacity: 0.96 },
    glassWrap: {
      overflow: 'hidden',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: GAMES_UI.goldSoft,
      borderRadius: 20,
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: '#EADFC4',
      shadowColor: GAMES_UI.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 3,
    },
    iconTile: {
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 5,
    },
    challengeLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: GAMES_UI.accent,
    },
    sparkBadge: {
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1,
      borderColor: '#EADFC4',
    },
    sparkBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: GAMES_UI.accent,
      letterSpacing: 0.5,
    },
    spark: {
      color: GAMES_UI.goldDeep,
    },
    badge: {
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1,
      borderColor: '#EADFC4',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: GAMES_UI.goldDeep,
      letterSpacing: 0.4,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: GAMES_UI.goldDeep,
      lineHeight: 16,
      marginBottom: 8,
    },
    track: {
      height: 6,
      borderRadius: 99,
      backgroundColor: 'rgba(194,154,78,0.2)',
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 99,
    },
    arrow: {
      opacity: 0.65,
    },
  });
}

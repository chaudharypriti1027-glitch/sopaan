import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { HOME_UI } from './homeTheme';

const XP_TARGET = 150;

const NEXT_TIER: Record<string, string> = {
  Rookie: 'Bronze',
  Bronze: 'Silver',
  Silver: 'Gold',
  Gold: 'Platinum',
  Platinum: 'Diamond',
};

type LeagueSnapshotProps = {
  league: HomeFeed['league'];
  onPress?: () => void;
};

export function LeagueSnapshot({ league, onPress }: LeagueSnapshotProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!league) {
    return null;
  }

  const tierKey = league.tier.trim();
  const nextTier = NEXT_TIER[tierKey] ?? NEXT_TIER[tierKey.toUpperCase()] ?? 'Bronze';
  const progressPct = Math.min(100, Math.round((league.xpThisWeek / XP_TARGET) * 100));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...HOME_UI.leagueGradient]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />

        <View style={styles.top}>
          <LinearGradient
            colors={['#D8B368', '#C29A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophyBox}
          >
            <Trophy size={26} color="#FFFFFF" strokeWidth={1.8} />
          </LinearGradient>

          <View style={styles.mid}>
            <View style={styles.rookieBadge}>
              <Text style={styles.rookieText}>{tierKey.toUpperCase()}</Text>
            </View>
            <Text style={styles.rankLine}>
              {t('home.leagueRank')}{' '}
              <Text style={styles.rankGold}>#{league.rankInLeague}</Text>
              <Text style={styles.rankMuted}> · </Text>
              <NumText style={styles.rankGold}>{league.xpThisWeek}</NumText>
              <Text style={styles.rankMuted}> {t('home.leagueXp')}</Text>
            </Text>
          </View>

          <View style={styles.chevron}>
            <ChevronRight size={15} color="rgba(255,255,255,0.4)" strokeWidth={2.2} />
          </View>
        </View>

        <View style={styles.xpPanel}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>{t('home.leagueToTier', { tier: nextTier })}</Text>
            <Text style={styles.xpNum}>
              {t('home.leagueXpProgress', { current: league.xpThisWeek, target: XP_TARGET })}
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={['#E3C97F', '#C29A4E']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.xpFill, { width: `${progressPct}%` }]}
            >
              <View style={styles.xpDot} />
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    pressable: { borderRadius: 26 },
    pressed: { opacity: 0.96 },
    card: {
      borderRadius: 26,
      paddingVertical: 20,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      overflow: 'hidden',
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 40,
      elevation: 6,
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    blobA: { top: -50, right: -50, width: 200, height: 200 },
    blobB: { bottom: -30, left: -20, width: 140, height: 140 },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 18,
      zIndex: 1,
    },
    trophyBox: {
      width: 58,
      height: 58,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    mid: { flex: 1 },
    rookieBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#E3C97F',
      borderRadius: 99,
      paddingHorizontal: 11,
      paddingVertical: 3,
      marginBottom: 7,
    },
    rookieText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: '#3A2C10',
    },
    rankLine: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    rankGold: {
      color: '#E3C97F',
      fontWeight: '800',
    },
    rankMuted: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
    },
    chevron: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    xpPanel: {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      zIndex: 1,
    },
    xpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    xpLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.45)',
      fontWeight: '600',
    },
    xpNum: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '700',
    },
    xpTrack: {
      height: 8,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.1)',
      overflow: 'visible',
    },
    xpFill: {
      height: '100%',
      borderRadius: 99,
      minWidth: 8,
      justifyContent: 'center',
    },
    xpDot: {
      position: 'absolute',
      right: -1,
      width: 15,
      height: 15,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      top: -3.5,
    },
  });
}

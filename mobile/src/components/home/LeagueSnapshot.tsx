import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import type { HomeFeed } from '../../types/home';
import { HOME_UI, homePressFeedback } from './homeTheme';

const XP_TARGET = 150;

const NEXT_TIER_KEY: Record<string, string> = {
  Rookie: 'bronze',
  Bronze: 'silver',
  Silver: 'gold',
  Gold: 'platinum',
  Platinum: 'diamond',
  rookie: 'bronze',
  bronze: 'silver',
  silver: 'gold',
  gold: 'platinum',
  platinum: 'diamond',
};

type LeagueSnapshotProps = {
  league: HomeFeed['league'];
  onPress?: () => void;
};

export function LeagueSnapshot({ league, onPress }: LeagueSnapshotProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  if (!league) {
    return null;
  }

  const tierKey = league.tier.trim();
  const nextTierKey = NEXT_TIER_KEY[tierKey] ?? NEXT_TIER_KEY[tierKey.toLowerCase()] ?? 'bronze';
  const currentTierLabel = t(`home.leagueTier.${tierKey.toLowerCase()}`, {
    defaultValue: tierKey,
  });
  const nextTierLabel = t(`home.leagueTier.${nextTierKey}`);
  const progressPct = Math.min(100, Math.round((league.xpThisWeek / XP_TARGET) * 100));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...HOME_UI.leagueGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.top}>
          <LinearGradient
            colors={[HOME_UI.goldLt, HOME_UI.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <Trophy size={20} color="#3E3213" strokeWidth={1.8} />
          </LinearGradient>
          <View style={styles.copy}>
            <Text style={styles.eyebrow} numberOfLines={1}>
              {t('home.leagueEyebrow', { tier: currentTierLabel })}
            </Text>
            <Text style={styles.title} numberOfLines={1}>
              {t('home.leagueRank')} #{league.rankInLeague}
            </Text>
          </View>
          <ChevronRight size={14} color={HOME_UI.goldDeep} strokeWidth={2.2} />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <NumText style={styles.statValue}>{league.xpThisWeek}</NumText>
            <Text style={styles.statLabel} numberOfLines={1}>
              {t('home.leagueXp')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValueSm} numberOfLines={1}>
              {nextTierLabel}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {t('home.nextTier')}
            </Text>
          </View>
        </View>

        <View style={styles.xpBlock}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel} numberOfLines={1} ellipsizeMode="tail">
              {t('home.leagueToTier', { tier: nextTierLabel })}
            </Text>
            <Text style={styles.xpNum} numberOfLines={1}>
              {t('home.leagueXpProgress', { current: league.xpThisWeek, target: XP_TARGET })}
            </Text>
          </View>
          <View style={styles.track}>
            <LinearGradient
              colors={[HOME_UI.goldLt, HOME_UI.gold]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.fill, { width: `${Math.max(progressPct, 4)}%` }]}
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    pressable: {
      borderRadius: HOME_UI.cardRadiusLg,
    },
    pressed: homePressFeedback,
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
      padding: 16,
      gap: 12,
      overflow: 'hidden',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: HOME_UI.goldDeep,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: HOME_UI.ink,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#F0E8D2',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      marginVertical: 10,
      backgroundColor: '#F0E8D2',
    },
    statValue: {
      fontSize: 17,
      fontWeight: '800',
      color: HOME_UI.ink,
    },
    statValueSm: {
      fontSize: 17,
      fontWeight: '800',
      color: HOME_UI.ink,
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: HOME_UI.muted,
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    xpBlock: {
      gap: 6,
    },
    xpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8,
    },
    xpLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 11.5,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    xpNum: {
      fontSize: 11.5,
      fontWeight: '800',
      color: HOME_UI.goldDeep,
      flexShrink: 0,
    },
    track: {
      height: 8,
      borderRadius: 99,
      backgroundColor: '#EFE8D3',
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 99,
      minWidth: 8,
    },
  });
}

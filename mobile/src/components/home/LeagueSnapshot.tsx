import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PremiumHeroCard } from '../PremiumHeroCard';
import { Text } from '../Text';
import type { HomeFeed } from '../../types/home';

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

function XpProgressBar({
  current,
  target,
  nextTier,
}: {
  current: number;
  target: number;
  nextTier: string;
}) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createXpStyles(), []);
  const progressPct = Math.min(100, Math.round((current / target) * 100));

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('home.leagueToTier', { tier: nextTier })}</Text>
        <Text style={styles.num}>
          {t('home.leagueXpProgress', { current, target })}
        </Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={['#E3C97F', '#C29A4E']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${progressPct}%` }]}
        >
          <View style={styles.knob} />
        </LinearGradient>
      </View>
    </View>
  );
}

export function LeagueSnapshot({ league, onPress }: LeagueSnapshotProps) {
  const { t } = useTranslation('app');

  if (!league) {
    return null;
  }

  const tierKey = league.tier.trim();
  const nextTier = NEXT_TIER[tierKey] ?? NEXT_TIER[tierKey.toUpperCase()] ?? 'Bronze';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <PremiumHeroCard
        icon={<Trophy size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={`${tierKey} League`}
        title={`${t('home.leagueRank')} #${league.rankInLeague}`}
        trailing={
          <View style={styles.chevron}>
            <ChevronRight size={15} color="rgba(255,255,255,0.5)" strokeWidth={2.2} />
          </View>
        }
        stats={[
          { label: t('home.leagueXp'), value: String(league.xpThisWeek) },
          { label: t('home.leagueToTier', { tier: nextTier }), value: nextTier },
        ]}
      >
        <XpProgressBar current={league.xpThisWeek} target={XP_TARGET} nextTier={nextTier} />
      </PremiumHeroCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: 22 },
  pressed: { opacity: 0.96 },
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
});

function createXpStyles() {
  return StyleSheet.create({
    panel: {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      zIndex: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    label: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.45)',
      fontWeight: '600',
    },
    num: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '700',
    },
    track: {
      height: 9,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.15)',
      overflow: 'visible',
    },
    fill: {
      height: '100%',
      borderRadius: 99,
      minWidth: 8,
      justifyContent: 'center',
    },
    knob: {
      position: 'absolute',
      right: -1,
      width: 15,
      height: 15,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      top: -3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 2,
    },
  });
}

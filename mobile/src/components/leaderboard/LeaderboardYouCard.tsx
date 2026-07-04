import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Trophy } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { LeaderboardEntry } from '../../api/leaderboard';
import { CountUpText } from './CountUpText';
import { LEADERBOARD_UI } from './leaderboardTokens';

type LeaderboardYouCardProps = {
  you?: LeaderboardEntry;
  onTakeMock?: () => void;
};

export function LeaderboardYouCard({ you, onTakeMock }: LeaderboardYouCardProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);
  const shimmerX = useSharedValue(-200);
  const isRanked = you?.rank != null;

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(400, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: '-18deg' }],
  }));

  return (
    <Animated.View entering={ZoomIn.duration(500)} style={styles.wrap}>
      <LinearGradient colors={[...LEADERBOARD_UI.youGradient]} style={styles.card}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />

        <View style={styles.header}>
          <LinearGradient colors={[LEADERBOARD_UI.goldLt, LEADERBOARD_UI.gold]} style={styles.trophy}>
            <Trophy size={25} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
          <View style={styles.who}>
            <Text style={styles.eyebrow}>{t('leaderboard.yourRank')}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {you?.name ?? '—'}
            </Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{you?.rank != null ? you.rank : '—'}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <StatCell
            label={t('leaderboard.accuracyLabel')}
            value={you?.avgAccuracy ?? 0}
            suffix="%"
            showDivider={false}
          />
          <StatCell label={t('leaderboard.attemptsLabel')} value={you?.attempts ?? 0} showDivider />
          <StatCell
            label={t('leaderboard.bestRankLabel')}
            textValue={you?.bestRank != null ? String(you.bestRank) : '—'}
            showDivider
          />
        </View>

        {!isRanked ? (
          <Pressable accessibilityRole="button" onPress={onTakeMock} style={styles.ctaPress}>
            <LinearGradient colors={[LEADERBOARD_UI.goldLt, LEADERBOARD_UI.gold]} style={styles.cta}>
              <Text style={styles.ctaText}>{t('leaderboard.unranked')}</Text>
              <ArrowRight size={15} color="#3a2c10" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

function StatCell({
  label,
  value,
  suffix,
  textValue,
  showDivider,
}: {
  label: string;
  value?: number;
  suffix?: string;
  textValue?: string;
  showDivider?: boolean;
}) {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={[styles.statCell, showDivider && styles.statCellDivider]}>
      {textValue != null ? (
        <Text style={styles.statValue}>{textValue}</Text>
      ) : (
        <CountUpText value={value ?? 0} suffix={suffix} style={styles.statValue} delay={350} />
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {},
    card: {
      borderRadius: 22,
      padding: 17,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(226,201,127,0.18)',
      shadowColor: LEADERBOARD_UI.navyDeep,
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.35,
      shadowRadius: 22,
      elevation: 8,
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: -120,
      width: 120,
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 13, zIndex: 2 },
    trophy: {
      width: 50,
      height: 50,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: LEADERBOARD_UI.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
      elevation: 4,
    },
    who: { flex: 1 },
    eyebrow: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
    },
    name: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: '#FFFFFF',
      marginTop: 2,
    },
    rankBadge: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: { fontSize: 16, fontWeight: '800', color: LEADERBOARD_UI.goldLt },
    stats: {
      flexDirection: 'row',
      marginTop: 15,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      borderRadius: 15,
      paddingVertical: 13,
      paddingHorizontal: 4,
      zIndex: 2,
    },
    statCell: { flex: 1, alignItems: 'center', position: 'relative' },
    statCellDivider: {
      borderLeftWidth: 1,
      borderLeftColor: 'rgba(255,255,255,0.1)',
    },
    statValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    statLabel: {
      fontSize: 9.5,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
      marginTop: 3,
    },
    ctaPress: { marginTop: 14, zIndex: 2 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 11,
      borderRadius: 13,
    },
    ctaText: { fontSize: 12, fontWeight: '800', color: '#3a2c10' },
  });
}

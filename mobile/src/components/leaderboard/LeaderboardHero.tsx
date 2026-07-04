import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, Sparkles, Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LeaderboardMeta } from '../../api/leaderboard';
import { CountUpText } from './CountUpText';
import { formatSeasonCountdown, LEADERBOARD_UI, type LeaderboardPeriod } from './leaderboardTokens';

type LeaderboardHeroProps = {
  meta?: LeaderboardMeta;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onBack: () => void;
};

const PERIODS: LeaderboardPeriod[] = ['daily', 'weekly', 'all-time'];

const SPARKS = [
  { top: 70, left: 40, size: 12, delay: 200 },
  { top: 120, right: 56, size: 9, delay: 1100 },
  { top: 180, left: 80, size: 7, delay: 1900 },
  { top: 96, right: 110, size: 8, delay: 2600 },
];

export function LeaderboardHero({ meta, period, onPeriodChange, onBack }: LeaderboardHeroProps) {
  const { t } = useTranslation('app');
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);
  const [countdown, setCountdown] = useState('—');

  useEffect(() => {
    if (!meta?.season.endsAt) {
      setCountdown('—');
      return;
    }
    const update = () => setCountdown(formatSeasonCountdown(meta.season.endsAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [meta?.season.endsAt]);

  const handleShare = () => {
    void Share.share({
      message: t('leaderboard.shareMessage', {
        season: meta?.season.label ?? t('leaderboard.seasonFallback'),
      }),
    });
  };

  return (
    <LinearGradient colors={[...LEADERBOARD_UI.heroGradient]} style={styles.hero}>
      <View style={styles.glowGold} pointerEvents="none" />
      <View style={styles.glowSage} pointerEvents="none" />

      {SPARKS.map((spark, index) => (
        <Spark key={`spark-${index}`} {...spark} />
      ))}

      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={19} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>{t('leaderboard.title')}</Text>
        <Pressable accessibilityRole="button" onPress={handleShare} style={styles.iconBtn}>
          <Share2 size={17} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.seasonRow}>
        <LinearGradient colors={[LEADERBOARD_UI.goldLt, LEADERBOARD_UI.gold]} style={styles.seasonPill}>
          <Trophy size={12} color="#3a2c10" strokeWidth={2.2} />
          <Text style={styles.seasonText}>{meta?.season.label ?? t('leaderboard.seasonFallback')}</Text>
        </LinearGradient>
        <View style={styles.livePill}>
          <LiveDot />
          <Text style={styles.liveText}>{t('leaderboard.live')}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { key: 'players', value: meta?.totalPlayers ?? 0, label: t('leaderboard.players') },
          { key: 'online', value: meta?.onlineNow ?? 0, label: t('leaderboard.onlineNow') },
          { key: 'season', value: countdown, label: t('leaderboard.seasonEnds'), isText: true },
        ].map((stat, index) => (
          <Animated.View
            key={stat.key}
            entering={FadeInUp.delay(index * 80).duration(500)}
            style={styles.statTile}
          >
            {stat.isText ? (
              <Text style={styles.statValue}>{stat.value}</Text>
            ) : (
              <CountUpText value={stat.value as number} style={styles.statValue} delay={350} />
            )}
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.filters}>
        {PERIODS.map((key) => {
          const active = period === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onPeriodChange(key)}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {t(`leaderboard.period.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

function Spark({ top, left, right, size, delay }: (typeof SPARKS)[number]) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(0.9, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(-6, { duration: 1600 }),
        withTiming(0, { duration: 1600 }),
      ),
      -1,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: delay }),
        withTiming(1, { duration: 1600 }),
        withTiming(0.6, { duration: 1600 }),
      ),
      -1,
    );
  }, [delay, opacity, scale, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          right,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Sparkles size={size} color={LEADERBOARD_UI.goldLt} fill={LEADERBOARD_UI.goldLt} />
    </Animated.View>
  );
}

function LiveDot() {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(withTiming(2.2, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
    );
    ringOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 900 }), withTiming(0.6, { duration: 900 })),
      -1,
    );
  }, [ringOpacity, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={stylesLive.wrap}>
      <Animated.View style={[stylesLive.ring, ringStyle]} />
      <View style={stylesLive.dot} />
    </View>
  );
}

const stylesLive = StyleSheet.create({
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6FCF97',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6FCF97',
  },
});

function createStyles(topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 46,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      overflow: 'hidden',
    },
    glowGold: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: 'rgba(194,154,78,0.24)',
    },
    glowSage: {
      position: 'absolute',
      bottom: -50,
      left: -50,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: 'rgba(95,138,123,0.2)',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 3 },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    seasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, zIndex: 3 },
    seasonPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    seasonText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#3a2c10',
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    liveText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#FFFFFF',
    },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 16, zIndex: 3 },
    statTile: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.09)',
      borderRadius: 15,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    statValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    statLabel: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 9.5,
      fontWeight: '700',
      marginTop: 3,
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    filters: {
      flexDirection: 'row',
      gap: 5,
      marginTop: 16,
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderRadius: 14,
      padding: 5,
      zIndex: 3,
    },
    filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
    filterBtnActive: { backgroundColor: '#FFFFFF' },
    filterText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
    filterTextActive: { color: LEADERBOARD_UI.navy },
  });
}

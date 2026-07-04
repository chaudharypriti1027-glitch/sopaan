import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown, ArrowUp, Circle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { LeaderboardEntry } from '../../api/leaderboard';
import { CountUpText } from './CountUpText';
import { LEADERBOARD_UI, nameInitials } from './leaderboardTokens';

type LeaderboardRankListProps = {
  items: LeaderboardEntry[];
  totalPlayers?: number;
  currentUserId?: string;
};

function paletteIndex(rank: number): number {
  if (rank === 1) return 0;
  if (rank === 2) return 1;
  if (rank === 3) return 2;
  return 3;
}

export function LeaderboardRankList({ items, totalPlayers, currentUserId }: LeaderboardRankListProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('leaderboard.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('leaderboard.emptyBody')}</Text>
      </View>
    );
  }

  const countLabel = t('leaderboard.studentCount', {
    count: totalPlayers ?? items.length,
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('leaderboard.rankings')}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((entry, index) => (
          <RankRow
            key={entry.userId}
            entry={entry}
            index={index}
            isYou={entry.userId === currentUserId}
            styles={styles}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

function RankRow({
  entry,
  index,
  isYou,
  styles,
  t,
}: {
  entry: LeaderboardEntry;
  index: number;
  isYou: boolean;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const rank = entry.rank ?? index + 1;
  const posStyle =
    rank === 1 ? styles.posGold : rank === 2 ? styles.posSage : rank === 3 ? styles.posBronze : styles.posNeutral;
  const posTextStyle =
    rank === 1
      ? styles.posTextGold
      : rank === 2
        ? styles.posTextSage
        : rank === 3
          ? styles.posTextBronze
          : styles.posTextNeutral;
  const colorIndex = paletteIndex(rank);
  const barGradient = LEADERBOARD_UI.barGradients[colorIndex];

  return (
    <Animated.View
      entering={FadeInUp.delay(350 + index * 100).duration(500)}
      style={[styles.row, index > 0 && styles.rowBorder, isYou && styles.rowYou]}
    >
      <View style={[styles.pos, posStyle]}>
        <Text style={[styles.posText, posTextStyle]}>{rank}</Text>
      </View>

      <View style={styles.avatarWrap}>
        <LinearGradient colors={[...LEADERBOARD_UI.avatarGradients[colorIndex]]} style={styles.avatar}>
          <Text style={styles.avatarText}>{nameInitials(entry.name)}</Text>
        </LinearGradient>
        {rank <= 3 ? (
          <LinearGradient colors={[LEADERBOARD_UI.goldLt, LEADERBOARD_UI.gold]} style={styles.coin}>
            <Circle size={10} color="#3a2c10" strokeWidth={1.5} />
          </LinearGradient>
        ) : null}
      </View>

      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.meta}>
          {t('leaderboard.avgAttempts', { accuracy: entry.avgAccuracy, attempts: entry.attempts })}
        </Text>
        <ProgressBar widthPct={entry.avgAccuracy} colors={barGradient} delay={500 + index * 100} />
      </View>

      <View style={styles.right}>
        <CountUpText value={entry.avgAccuracy} suffix="%" style={styles.score} delay={400 + index * 80} />
        <TrendPill delta={entry.rankDelta} styles={styles} />
      </View>
    </Animated.View>
  );
}

function ProgressBar({
  widthPct,
  colors,
  delay,
}: {
  widthPct: number;
  colors: readonly [string, string];
  delay: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }
    fillWidth.value = 0;
    fillWidth.value = withDelay(
      delay,
      withTiming((Math.max(widthPct, 4) / 100) * trackWidth, {
        duration: 1100,
        easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      }),
    );
  }, [delay, fillWidth, trackWidth, widthPct]);

  const style = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View
      style={stylesBar.track}
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width);
      }}
    >
      <Animated.View style={[stylesBar.fill, style]}>
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={stylesBar.gradient}
        />
      </Animated.View>
    </View>
  );
}

function TrendPill({
  delta,
  styles,
}: {
  delta?: number | null;
  styles: ReturnType<typeof createStyles>;
}) {
  if (delta == null || delta === 0) {
    return (
      <View style={[styles.trend, styles.trendEq]}>
        <Text style={[styles.trendText, styles.trendTextEq]}>–</Text>
      </View>
    );
  }

  if (delta > 0) {
    return (
      <View style={[styles.trend, styles.trendUp]}>
        <ArrowUp size={10} color={LEADERBOARD_UI.sageDeep} strokeWidth={2.5} />
        <Text style={[styles.trendText, styles.trendTextUp]}>{Math.abs(delta)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.trend, styles.trendDown]}>
      <ArrowDown size={10} color={LEADERBOARD_UI.muted} strokeWidth={2.5} />
      <Text style={[styles.trendText, styles.trendTextDown]}>{Math.abs(delta)}</Text>
    </View>
  );
}

const stylesBar = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 999,
    backgroundColor: LEADERBOARD_UI.hair,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', overflow: 'hidden', borderRadius: 999 },
  gradient: { flex: 1, height: '100%', borderRadius: 999 },
});

function createStyles() {
  return StyleSheet.create({
    wrap: { marginTop: 22 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, color: LEADERBOARD_UI.ink },
    countPill: {
      backgroundColor: LEADERBOARD_UI.surface,
      borderWidth: 1,
      borderColor: LEADERBOARD_UI.line,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    countText: { fontSize: 11, fontWeight: '700', color: LEADERBOARD_UI.muted },
    list: {
      backgroundColor: LEADERBOARD_UI.surface,
      borderWidth: 1,
      borderColor: LEADERBOARD_UI.line,
      borderRadius: 22,
      overflow: 'hidden',
      shadowColor: LEADERBOARD_UI.navy,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    rowBorder: { borderTopWidth: 1, borderTopColor: LEADERBOARD_UI.hair },
    rowYou: { backgroundColor: LEADERBOARD_UI.goldSoft },
    pos: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    posGold: { backgroundColor: LEADERBOARD_UI.goldSoft },
    posSage: { backgroundColor: LEADERBOARD_UI.sageSoft },
    posBronze: { backgroundColor: LEADERBOARD_UI.bronzeSoft },
    posNeutral: { backgroundColor: LEADERBOARD_UI.navySoft },
    posText: { fontSize: 12.5, fontWeight: '800' },
    posTextGold: { color: LEADERBOARD_UI.goldDeep },
    posTextSage: { color: LEADERBOARD_UI.sageDeep },
    posTextBronze: { color: LEADERBOARD_UI.bronze },
    posTextNeutral: { color: LEADERBOARD_UI.navy },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    coin: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      width: 19,
      height: 19,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mid: { flex: 1, minWidth: 0 },
    name: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2, color: LEADERBOARD_UI.ink },
    meta: { fontSize: 11.5, fontWeight: '600', color: LEADERBOARD_UI.muted, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    score: { fontSize: 16, fontWeight: '800', color: LEADERBOARD_UI.ink },
    trend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    trendUp: { backgroundColor: LEADERBOARD_UI.sageSoft },
    trendDown: { backgroundColor: LEADERBOARD_UI.navySoft },
    trendEq: { backgroundColor: LEADERBOARD_UI.hair },
    trendText: { fontSize: 10, fontWeight: '800' },
    trendTextUp: { color: LEADERBOARD_UI.sageDeep },
    trendTextDown: { color: LEADERBOARD_UI.muted },
    trendTextEq: { color: LEADERBOARD_UI.faint },
    empty: {
      marginTop: 24,
      padding: 24,
      alignItems: 'center',
      backgroundColor: LEADERBOARD_UI.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: LEADERBOARD_UI.line,
    },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: LEADERBOARD_UI.ink },
    emptyBody: {
      fontSize: 13,
      color: LEADERBOARD_UI.muted,
      textAlign: 'center',
      marginTop: 6,
    },
  });
}

import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Medal } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import type { LeaderboardEntry } from '../../api/leaderboard';
import { CountUpText } from './CountUpText';
import { LEADERBOARD_UI, nameInitials, truncateName } from './leaderboardTokens';

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
};

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const styles = useMemo(() => createStyles(), []);

  if (entries.length < 3) {
    return null;
  }

  const second = entries[1];
  const first = entries[0];
  const third = entries[2];

  return (
    <View style={styles.wrap}>
      <ConfettiOverlay />
      <PodiumCol entry={second} place={2} delay={250} styles={styles} />
      <PodiumCol entry={first} place={1} delay={50} styles={styles} />
      <PodiumCol entry={third} place={3} delay={150} styles={styles} />
    </View>
  );
}

function ConfettiOverlay() {
  const colors = [LEADERBOARD_UI.gold, LEADERBOARD_UI.goldLt, LEADERBOARD_UI.sage, LEADERBOARD_UI.navy];
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: 14 }).map((_, index) => (
        <ConfettiPiece key={`c-${index}`} color={colors[index % colors.length]} index={index} />
      ))}
    </View>
  );
}

function ConfettiPiece({ color, index }: { color: string; index: number }) {
  const translateY = useSharedValue(-10);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const drift = (Math.random() * 80 - 40) | 0;

  useEffect(() => {
    const startDelay = Math.random() * 2000;
    opacity.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 2100 })),
        -1,
      ),
    );
    translateY.value = withDelay(
      startDelay,
      withRepeat(withTiming(120, { duration: 2400, easing: Easing.out(Easing.quad) }), -1),
    );
    translateX.value = withDelay(startDelay, withRepeat(withTiming(drift, { duration: 2400 }), -1));
    rotate.value = withDelay(startDelay, withRepeat(withTiming(220, { duration: 2400 }), -1));
  }, [drift, opacity, rotate, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -6,
          left: '50%',
          marginLeft: -3 + (index % 7) * 8 - 28,
          width: 6,
          height: 9,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function PodiumCol({
  entry,
  place,
  delay,
  styles,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  delay: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const bob = useSharedValue(0);
  const halo = useSharedValue(1);

  useEffect(() => {
    if (place === 1) {
      bob.value = withRepeat(
        withSequence(withTiming(-5, { duration: 1200 }), withTiming(0, { duration: 1200 })),
        -1,
      );
      halo.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 1300 }), withTiming(1, { duration: 1300 })),
        -1,
      );
    }
  }, [bob, halo, place]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: halo.value }],
    opacity: 0.6 - (halo.value - 1) * 3,
  }));

  const gradient =
    place === 1
      ? LEADERBOARD_UI.podiumGold
      : place === 2
        ? LEADERBOARD_UI.podiumSilver
        : LEADERBOARD_UI.podiumBronze;

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600).springify()} style={styles.col}>
      {place === 1 ? (
        <Animated.View style={[styles.crown, crownStyle]}>
          <Crown size={26} color={LEADERBOARD_UI.gold} fill={LEADERBOARD_UI.gold} />
        </Animated.View>
      ) : (
        <LinearGradient
          colors={place === 2 ? ['#9AA6B2', '#79838F'] : ['#C98A54', '#A9652F']}
          style={[styles.medal, place === 2 ? styles.medalSilver : styles.medalBronze]}
        >
          <Medal size={15} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
      )}

      <View style={place === 1 ? styles.bigAvatarWrap : undefined}>
        {place === 1 ? <Animated.View style={[styles.haloRing, haloStyle]} /> : null}
        <LinearGradient
          colors={[...gradient]}
          style={[styles.avatar, place === 1 ? styles.avatarBig : styles.avatarSm]}
        >
          <Text style={[styles.initials, place === 1 && styles.initialsBig]}>
            {nameInitials(entry.name)}
          </Text>
        </LinearGradient>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {truncateName(entry.name)}
      </Text>
      {place === 1 ? (
        <LinearGradient colors={[LEADERBOARD_UI.gold, LEADERBOARD_UI.goldDeep]} style={[styles.pill, styles.pillGold]}>
          <CountUpText value={entry.avgAccuracy} suffix="%" style={styles.pillText} delay={400} />
        </LinearGradient>
      ) : place === 3 ? (
        <LinearGradient colors={['#C98A54', '#A9652F']} style={[styles.pill, styles.pillBronze]}>
          <CountUpText value={entry.avgAccuracy} suffix="%" style={styles.pillText} delay={400} />
        </LinearGradient>
      ) : (
        <View style={[styles.pill, styles.pillSilver]}>
          <CountUpText value={entry.avgAccuracy} suffix="%" style={styles.pillText} delay={400} />
        </View>
      )}
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 10,
      marginTop: 26,
      marginBottom: 6,
      paddingHorizontal: 4,
      minHeight: 170,
    },
    col: { flex: 1, alignItems: 'center' },
    crown: { marginBottom: 2 },
    medal: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: -13,
      zIndex: 3,
    },
    medalSilver: {},
    medalBronze: {},
    bigAvatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    haloRing: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: 'rgba(226,201,127,0.5)',
    },
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: LEADERBOARD_UI.navy,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    avatarBig: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 3,
      borderColor: LEADERBOARD_UI.gold,
    },
    avatarSm: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    initials: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' },
    initialsBig: { fontSize: 29 },
    name: {
      fontSize: 13,
      fontWeight: '800',
      marginTop: 10,
      color: LEADERBOARD_UI.ink,
      maxWidth: '100%',
    },
    pill: {
      marginTop: 8,
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 4,
    },
    pillGold: {},
    pillSilver: { backgroundColor: '#8A93A0' },
    pillBronze: {},
    pillText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  });
}

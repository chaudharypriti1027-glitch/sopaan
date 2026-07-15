import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Coins, Flame, Gamepad2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../GlassSurface';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';
import { premiumGlowShadow } from '../premium/premiumStyles';

type GamesHeroProps = {
  greeting: string;
  screenTitle: string;
  coins: number;
  streak: number;
  gamesDone: number;
  rank?: number | null;
  title: string;
  subtitle: string;
  badgeLabel: string;
  streakLabel: string;
  gamesDoneLabel: string;
  rankLabel: string;
  onBack?: () => void;
  onRankPress?: () => void;
};

export function GamesHero({
  greeting,
  screenTitle,
  coins,
  streak,
  gamesDone,
  rank,
  title,
  subtitle,
  badgeLabel,
  streakLabel,
  gamesDoneLabel,
  rankLabel,
  onBack,
  onRankPress,
}: GamesHeroProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <LinearGradient
      colors={[...GAMES_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.blob, styles.blobC]} />

      <View style={styles.greetRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <GlassSurface tone="dark" intensity={22} borderRadius={14} style={styles.backGlass}>
              <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </GlassSurface>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.greetText}>
          <Text style={styles.greetSub}>{greeting}</Text>
          <Text style={styles.greetName}>{screenTitle}</Text>
        </View>

        <GlassSurface tone="dark" intensity={22} borderRadius={100} style={styles.coinPill}>
          <Coins size={14} color={GAMES_UI.gold} strokeWidth={2.2} />
          <NumText style={styles.coinValue}>{coins}</NumText>
        </GlassSurface>
      </View>

      <GlassSurface tone="dark" intensity={22} borderRadius={100} style={styles.streakPill}>
        <Flame size={14} color={GAMES_UI.gold} fill={GAMES_UI.gold} />
        <Text style={styles.streakText}>{badgeLabel}</Text>
      </GlassSurface>

      <GlassSurface tone="dark" intensity={26} borderRadius={22} style={styles.statsCard}>
        <View style={styles.goalRow}>
          <LinearGradient
            colors={['#D8B368', '#C29A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goalIcon}
          >
            <Gamepad2 size={20} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
          <View style={styles.goalCopy}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <View style={styles.statValRow}>
              <Flame size={14} color={GAMES_UI.gold} fill={GAMES_UI.gold} strokeWidth={2} />
              <NumText style={styles.statVal}>{streak}</NumText>
            </View>
            <Text style={styles.statLbl}>{streakLabel}</Text>
          </View>
          <View style={styles.stat}>
            <NumText style={styles.statVal}>{gamesDone}</NumText>
            <Text style={styles.statLbl}>{gamesDoneLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onRankPress}
            disabled={!onRankPress}
            style={({ pressed }) => [
              styles.stat,
              onRankPress && styles.statTappable,
              pressed && onRankPress && styles.pressed,
            ]}
          >
            <View style={styles.statRankRow}>
              <Text style={styles.statVal}>{rank != null ? `#${rank}` : '—'}</Text>
              {onRankPress ? (
                <ChevronRight size={12} color="rgba(255,255,255,0.55)" strokeWidth={2.5} />
              ) : null}
            </View>
            <Text style={styles.statLbl}>{rankLabel}</Text>
          </Pressable>
        </View>
      </GlassSurface>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 28,
      overflow: 'hidden',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.18)',
    },
    blobA: { top: -80, right: -60, width: 260, height: 260 },
    blobB: { top: 50, right: 55, width: 90, height: 90, opacity: 0.5 },
    blobC: { bottom: -40, left: -30, width: 180, height: 180 },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
      zIndex: 2,
    },
    backBtn: {
      width: 40,
      height: 40,
    },
    backGlass: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backSpacer: {
      width: 40,
    },
    greetText: { flex: 1 },
    greetSub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      letterSpacing: 0.5,
      marginBottom: 1,
      fontWeight: '500',
    },
    greetName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    coinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    coinValue: {
      fontSize: 13,
      fontWeight: '800',
      color: '#E3C97F',
    },
    streakPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 5,
      paddingHorizontal: 13,
      paddingLeft: 10,
      marginBottom: 16,
      zIndex: 2,
    },
    streakText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#E3C97F',
    },
    statsCard: {
      zIndex: 2,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 16,
    },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    goalIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...premiumGlowShadow(GAMES_UI.gold),
    },
    goalCopy: {
      flex: 1,
      minWidth: 0,
    },
    heroTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 4,
    },
    stats: {
      flexDirection: 'row',
      gap: 10,
    },
    stat: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    statTappable: {
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    statRankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    pressed: {
      opacity: 0.88,
    },
    statValRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statVal: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    statLbl: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
}

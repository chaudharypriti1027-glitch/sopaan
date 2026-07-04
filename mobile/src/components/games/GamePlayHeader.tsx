import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, Gamepad2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../GlassSurface';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { premiumGlowShadow } from '../premium/premiumStyles';
import { GAMES_UI } from './gamesTheme';

type GamePlayHeaderProps = {
  title: string;
  subtitle?: string;
  coinReward?: number;
  timerLabel?: string;
  timerTone?: 'red' | 'green' | 'orange';
  onBack: () => void;
};

const TIMER_COLORS = {
  red: { bg: 'rgba(196,99,79,0.16)', border: 'rgba(196,99,79,0.28)', text: GAMES_UI.red },
  green: { bg: 'rgba(95,138,123,0.16)', border: 'rgba(95,138,123,0.28)', text: GAMES_UI.sage },
  orange: { bg: 'rgba(194,154,78,0.16)', border: 'rgba(194,154,78,0.32)', text: GAMES_UI.goldDeep },
} as const;

export function GamePlayHeader({
  title,
  subtitle,
  coinReward,
  timerLabel,
  timerTone = 'red',
  onBack,
}: GamePlayHeaderProps) {
  const insets = useSafeAreaInsets();
  const timerColors = TIMER_COLORS[timerTone];
  const styles = useMemo(() => createStyles(insets.top, timerColors), [insets.top, timerColors]);

  return (
    <LinearGradient
      colors={[...GAMES_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />

      <View style={styles.row}>
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

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {timerLabel ? (
          <GlassSurface tone="dark" intensity={20} borderRadius={100} style={styles.timer}>
            <Clock size={13} color={timerColors.text} strokeWidth={2} />
            <Text style={[styles.timerText, { color: timerColors.text }]}>{timerLabel}</Text>
          </GlassSurface>
        ) : coinReward != null ? (
          <GlassSurface tone="dark" intensity={22} borderRadius={100} style={styles.rewardPill}>
            <LinearGradient
              colors={['#E3C97F', '#C29A4E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardIcon}
            >
              <Gamepad2 size={12} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
            <NumText style={styles.rewardText}>+{coinReward}</NumText>
          </GlassSurface>
        ) : null}
      </View>
    </LinearGradient>
  );
}

function createStyles(
  topInset: number,
  timerColors: (typeof TIMER_COLORS)[keyof typeof TIMER_COLORS],
) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 10,
      paddingHorizontal: 20,
      paddingBottom: 18,
      overflow: 'hidden',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.18)',
    },
    blobA: { top: -60, right: -40, width: 180, height: 180 },
    blobB: { bottom: -30, left: -20, width: 100, height: 100, opacity: 0.55 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
    pressed: { opacity: 0.88 },
    info: { flex: 1, minWidth: 0 },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 11.5,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 3,
      lineHeight: 15,
    },
    timer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: timerColors.bg,
      borderColor: timerColors.border,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '900',
    },
    rewardPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      paddingLeft: 6,
    },
    rewardIcon: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...premiumGlowShadow(GAMES_UI.gold),
    },
    rewardText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#E3C97F',
    },
  });
}

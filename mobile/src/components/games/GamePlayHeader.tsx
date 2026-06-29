import { ChevronLeft, Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GamePlayHeaderProps = {
  title: string;
  subtitle?: string;
  timerLabel?: string;
  timerTone?: 'red' | 'green' | 'orange';
  onBack: () => void;
};

const TIMER_COLORS = {
  red: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: GAMES_UI.red },
  green: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: GAMES_UI.green },
  orange: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: '#F97316' },
} as const;

export function GamePlayHeader({
  title,
  subtitle,
  timerLabel,
  timerTone = 'red',
  onBack,
}: GamePlayHeaderProps) {
  const insets = useSafeAreaInsets();
  const timerColors = TIMER_COLORS[timerTone];
  const styles = useMemo(() => createStyles(insets.top, timerColors), [insets.top, timerColors]);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={20} color={GAMES_UI.text} strokeWidth={2.5} />
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {timerLabel ? (
        <View style={styles.timer}>
          <Clock size={14} color={timerColors.text} strokeWidth={2} />
          <Text style={styles.timerText}>{timerLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  topInset: number,
  timerColors: (typeof TIMER_COLORS)[keyof typeof TIMER_COLORS],
) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 14,
      backgroundColor: GAMES_UI.bg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    },
    info: { flex: 1 },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    subtitle: {
      fontSize: 12,
      color: GAMES_UI.muted,
      marginTop: 2,
    },
    timer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: timerColors.bg,
      borderWidth: 1.5,
      borderColor: timerColors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    timerText: {
      fontSize: 14,
      fontWeight: '900',
      color: timerColors.text,
    },
  });
}

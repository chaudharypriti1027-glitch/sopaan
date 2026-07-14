import { Droplets, Eye, Pause, Play, SkipForward, StretchHorizontal, Wind } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  IconButton,
  PremiumFeatureCard,
  TimerRing,
} from '../../components';
import {
  BREAK_TIMER_SECONDS,
  FOCUS_BREAK_TIPS,
  FOCUS_TIMER_SECONDS,
  POMODORO_CYCLES,
} from '../../content/focusTimerContent';
import { useLogFocus } from '../../hooks';
import { toneColors, toneForIndex } from '../../utils/iconTone';
import { useTheme } from '../../theme';

type Phase = 'focus' | 'break';

const BREAK_TIP_ICONS: Record<(typeof FOCUS_BREAK_TIPS)[number]['id'], LucideIcon> = {
  stretch: StretchHorizontal,
  hydrate: Droplets,
  'eye-rest': Eye,
  breathe: Wind,
};

export function FocusTimerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const logFocus = useLogFocus();

  const [phase, setPhase] = useState<Phase>('focus');
  const [cycleIndex, setCycleIndex] = useState(0);
  const [remaining, setRemaining] = useState(FOCUS_TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [focusMinutesLogged, setFocusMinutesLogged] = useState(0);

  const totalSec = phase === 'focus' ? FOCUS_TIMER_SECONDS : BREAK_TIMER_SECONDS;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onPhaseComplete = useCallback(() => {
    clearTimer();
    setRunning(false);

    if (phase === 'focus') {
      const minutes = Math.round(FOCUS_TIMER_SECONDS / 60);
      setFocusMinutesLogged((m) => m + minutes);
      logFocus.mutate({ focusMinutes: minutes, sessions: 1 });
      setPhase('break');
      setRemaining(BREAK_TIMER_SECONDS);
    } else {
      const nextCycle = cycleIndex + 1;
      if (nextCycle >= POMODORO_CYCLES) {
        setCycleIndex(0);
      } else {
        setCycleIndex(nextCycle);
      }
      setPhase('focus');
      setRemaining(FOCUS_TIMER_SECONDS);
    }
  }, [phase, cycleIndex, clearTimer, logFocus]);

  useEffect(() => {
    if (!running) {
      clearTimer();
      endAtRef.current = null;
      return;
    }

    endAtRef.current = Date.now() + remaining * 1000;
    intervalRef.current = setInterval(() => {
      if (!endAtRef.current) return;
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        onPhaseComplete();
      }
    }, 250);

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, clearTimer, onPhaseComplete]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && running && endAtRef.current) {
        const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
        setRemaining(left);
        if (left <= 0) onPhaseComplete();
      }
    });
    return () => sub.remove();
  }, [running, onPhaseComplete]);

  const handleSkip = () => {
    onPhaseComplete();
  };

  const phaseLabel = phase === 'focus' ? t('focusTimer.focus') : t('focusTimer.break');

  return (
    <FeatureScreenLayout
      title={t('focusTimer.title')}
      subtitle={t('focusTimer.subtitle', { minutes: focusMinutesLogged })}
    >
      <PremiumFeatureCard style={styles.timerCard}>
        <Text style={styles.phase}>{phaseLabel}</Text>
        <TimerRing totalSec={totalSec} remainingSec={remaining} size={200} strokeWidth={10} />
        <View style={styles.dots}>
          {Array.from({ length: POMODORO_CYCLES }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < cycleIndex && styles.dotDone,
                i === cycleIndex && phase === 'focus' && running && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.controls}>
          <IconButton
            accessibilityLabel={running ? t('focusTimer.pauseA11y') : t('focusTimer.playA11y')}
            variant="ghost"
            icon={
              running ? (
                <Pause size={28} color={theme.colors.brand.primary} />
              ) : (
                <Play size={28} color={theme.colors.brand.primary} />
              )
            }
            onPress={() => setRunning((r) => !r)}
            style={styles.iconBtn}
          />
          <Button
            label={t('focusTimer.skip')}
            variant="ghost"
            size="sm"
            icon={<SkipForward size={16} />}
            onPress={handleSkip}
          />
        </View>
      </PremiumFeatureCard>

      {phase === 'break' ? (
        <View style={styles.breakSection}>
          <Text style={styles.breakTitle}>{t('focusTimer.breakTitle')}</Text>
          <View style={styles.tipGrid}>
            {FOCUS_BREAK_TIPS.map((tip, index) => {
              const Icon = BREAK_TIP_ICONS[tip.id];
              const tone = toneColors(toneForIndex(index));
              return (
                <View key={tip.id} style={[styles.tipTile, { backgroundColor: tone.bg }]}>
                  <Icon size={22} color={tone.fg} />
                  <Text style={[styles.tipLabel, { color: tone.fg }]}>{t(tip.labelKey)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    timerCard: { alignItems: 'center', gap: theme.spacing.lg, paddingVertical: theme.spacing.xl },
    phase: {
      ...theme.typography.presets.eyebrow,
      color: theme.colors.brand.primary,
    },
    dots: { flexDirection: 'row', gap: theme.spacing.sm },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.border.default,
    },
    dotDone: { backgroundColor: theme.colors.semantic.success },
    dotActive: { backgroundColor: theme.colors.brand.primary },
    controls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
    iconBtn: { padding: theme.spacing.sm },
    breakSection: { gap: theme.spacing.md },
    breakTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    tipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tipTile: {
      width: '47%',
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.radii.card,
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    tipLabel: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
  });
}

import { Droplets, Eye, Pause, Play, SkipForward, StretchHorizontal, Wind } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, IconButton, Screen, SectionTitle, TimerRing } from '../../components';
import { useLogFocus } from '../../hooks';
import { useTheme } from '../../theme';

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;
const CYCLES = 4;

type Phase = 'focus' | 'break';

const BREAK_TIPS = [
  { id: 'stretch', label: 'Stretch', icon: StretchHorizontal },
  { id: 'hydrate', label: 'Hydrate', icon: Droplets },
  { id: 'eye-rest', label: 'Eye rest', icon: Eye },
  { id: 'breathe', label: 'Breathe', icon: Wind },
] as const;

export function FocusTimerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const logFocus = useLogFocus();

  const [phase, setPhase] = useState<Phase>('focus');
  const [cycleIndex, setCycleIndex] = useState(0);
  const [remaining, setRemaining] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [focusMinutesLogged, setFocusMinutesLogged] = useState(0);

  const totalSec = phase === 'focus' ? FOCUS_SEC : BREAK_SEC;
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
      const minutes = Math.round(FOCUS_SEC / 60);
      setFocusMinutesLogged((m) => m + minutes);
      logFocus.mutate({ focusMinutes: minutes, sessions: 1 });
      setPhase('break');
      setRemaining(BREAK_SEC);
    } else {
      const nextCycle = cycleIndex + 1;
      if (nextCycle >= CYCLES) {
        setCycleIndex(0);
      } else {
        setCycleIndex(nextCycle);
      }
      setPhase('focus');
      setRemaining(FOCUS_SEC);
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

  const phaseLabel = phase === 'focus' ? 'Focus' : 'Break';

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Focus Timer"
        subtitle={`Pomodoro · ${focusMinutesLogged} min logged today`}
      />

      <Card style={styles.timerCard}>
        <Text style={styles.phase}>{phaseLabel}</Text>
        <TimerRing totalSec={totalSec} remainingSec={remaining} size={200} strokeWidth={10} />
        <View style={styles.dots}>
          {Array.from({ length: CYCLES }, (_, i) => (
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
      </Card>

      {phase === 'break' ? (
        <View style={styles.breakSection}>
          <Text style={styles.breakTitle}>On your break, try</Text>
          <View style={styles.tipGrid}>
            {BREAK_TIPS.map(({ id, label, icon: Icon }) => (
              <View key={id} style={styles.tipTile}>
                <Icon size={22} color={theme.colors.brand.primary} />
                <Text style={styles.tipLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
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

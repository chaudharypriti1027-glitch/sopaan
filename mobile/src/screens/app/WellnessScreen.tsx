import { Pause, Play } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, QueryStateView, Screen, SectionTitle, TimerRing } from '../../components';
import { useNetworkStatus, useWellnessSessions } from '../../hooks';
import type { WellnessSession } from '../../api/wellness';
import { useTheme } from '../../theme';

export function WellnessScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();
  const sessionsQuery = useWellnessSessions();

  const [active, setActive] = useState<WellnessSession | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!playing || !active) {
      clearTimer();
      return;
    }
    endAtRef.current = Date.now() + remainingSec * 1000;
    intervalRef.current = setInterval(() => {
      if (!endAtRef.current) return;
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemainingSec(left);
      if (left <= 0) {
        clearTimer();
        setPlaying(false);
        setActive(null);
      }
    }, 500);
    return clearTimer;
    // `remainingSec` is intentionally excluded — it's read once to seed
    // `endAtRef` and updated by the interval itself; including it would
    // restart the countdown on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, active]);

  const startSession = (session: WellnessSession) => {
    const total = session.durationMin * 60;
    setActive(session);
    setRemainingSec(total);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!active) return;
    setPlaying((p) => !p);
  };

  const totalSec = active ? active.durationMin * 60 : 0;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Wellness"
        subtitle="Calm sessions for breathing, pre-exam nerves, sleep, and focus reset"
      />

      {active ? (
        <Card style={styles.playerCard}>
          <Text style={styles.activeTitle}>{active.title}</Text>
          <TimerRing totalSec={totalSec} remainingSec={remainingSec} size={140} strokeWidth={8} />
          <Pressable onPress={togglePlay} style={styles.playBtn}>
            {playing ? (
              <Pause size={32} color={theme.colors.brand.primary} />
            ) : (
              <Play size={32} color={theme.colors.brand.primary} />
            )}
          </Pressable>
          <Pressable onPress={() => { setActive(null); setPlaying(false); clearTimer(); }}>
            <Text style={styles.endLink}>End session</Text>
          </Pressable>
        </Card>
      ) : null}

      <QueryStateView
        isLoading={sessionsQuery.isLoading}
        isError={sessionsQuery.isError}
        isFetching={sessionsQuery.isFetching}
        isOffline={isOffline}
        hasData={(sessionsQuery.data?.items.length ?? 0) > 0}
        onRetry={() => void sessionsQuery.refetch()}
      >
        <View style={styles.list}>
          {(sessionsQuery.data?.items ?? []).map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Pill label={`${session.durationMin} min`} variant="muted" />
              </View>
              <Text style={styles.category}>{session.category.replace(/-/g, ' ')}</Text>
              <Text style={styles.description}>{session.description}</Text>
              <Pressable onPress={() => startSession(session)} style={styles.startRow}>
                <Play size={18} color={theme.colors.brand.primary} />
                <Text style={styles.startLabel}>Play session</Text>
              </Pressable>
            </Card>
          ))}
        </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    playerCard: { alignItems: 'center', gap: theme.spacing.md },
    activeTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    playBtn: { padding: theme.spacing.sm },
    endLink: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    list: { gap: theme.spacing.md },
    sessionCard: { gap: theme.spacing.sm },
    sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    category: {
      ...theme.typography.presets.eyebrow,
      color: theme.colors.brand.primary,
      textTransform: 'capitalize',
    },
    description: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    startRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    startLabel: { ...theme.typography.presets.bodyMedium, color: theme.colors.brand.primary },
  });
}

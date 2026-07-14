import { Bell, BellOff, BookOpen, CalendarClock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { NumText } from '../NumText';
import { useLiveClassCountdown } from '../../hooks/useLiveClassCountdown';
import { useLiveClassReminder } from '../../hooks';
import type { LiveClass } from '../../api/liveClasses';
import { formatLiveClassWhenLong } from '../../content/liveClassesContent';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

type LiveClassScheduledPanelProps = {
  liveClass: LiveClass;
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function LiveClassScheduledPanel({ liveClass }: LiveClassScheduledPanelProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reminderMutation = useLiveClassReminder();
  const startsAt = liveClass.startsAt ?? liveClass.scheduledAt;
  const countdown = useLiveClassCountdown(startsAt);

  const toggleReminder = () => {
    reminderMutation.mutate(
      { id: liveClass.id, enabled: !liveClass.reminderSet },
      {
        onSuccess: () =>
          Alert.alert(
            liveClass.reminderSet ? t('reminderRemoved') : t('reminderSet'),
            liveClass.reminderSet ? t('reminderRemovedBody') : t('reminderSetBody'),
          ),
        onError: (err) => Alert.alert(t('reminderFailed'), String(err)),
      },
    );
  };

  return (
    <LinearGradient
      colors={[LIVE.stageMid, LIVE.navy, LIVE.stageDeep]}
      locations={[0, 0.5, 1]}
      style={styles.root}
    >
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.card}>
        <CalendarClock size={30} color={LIVE.goldLt} strokeWidth={1.75} />
        <Text style={styles.heading}>{t('startsIn')}</Text>

        {countdown.hasTarget ? (
          <View style={styles.countdownRow}>
            <CountdownUnit label={t('days')} value={pad(countdown.days)} />
            <Text style={styles.sep}>:</Text>
            <CountdownUnit label={t('hours')} value={pad(countdown.hours)} />
            <Text style={styles.sep}>:</Text>
            <CountdownUnit label={t('mins')} value={pad(countdown.minutes)} />
            <Text style={styles.sep}>:</Text>
            <CountdownUnit label={t('secs')} value={pad(countdown.seconds)} />
          </View>
        ) : (
          <Text style={styles.whenUnknown}>{t('scheduleTbd')}</Text>
        )}

        {startsAt ? (
          <Text style={styles.when}>{formatLiveClassWhenLong(startsAt)}</Text>
        ) : null}

        {liveClass.topic ? (
          <View style={styles.topicRow}>
            <BookOpen size={15} color={LIVE.goldLt} strokeWidth={1.75} />
            <Text style={styles.topic}>{liveClass.topic}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={toggleReminder}
          disabled={reminderMutation.isPending}
          style={[styles.notifyBtn, liveClass.reminderSet && styles.notifyBtnOn]}
        >
          {liveClass.reminderSet ? (
            <BellOff size={18} color={LIVE.inkPin} />
          ) : (
            <Bell size={18} color={LIVE.inkPin} />
          )}
          <Text style={styles.notifyLabel}>
            {liveClass.reminderSet ? t('reminderOn') : t('notifyMe')}
          </Text>
        </Pressable>

        <Text style={styles.hint}>
          {countdown.isPast ? t('waitingForHost') : t('scheduledHint')}
        </Text>
      </View>
    </LinearGradient>
  );
}

function CountdownUnit({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createUnitStyles(theme), [theme]);

  return (
    <View style={styles.unit}>
      <NumText style={styles.value}>{value}</NumText>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createUnitStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    unit: { alignItems: 'center', minWidth: 52 },
    value: {
      fontSize: 28,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    label: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textMuted,
      textTransform: 'uppercase',
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    glow: {
      position: 'absolute',
      top: '18%',
      alignSelf: 'center',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(194,154,78,0.18)',
    },
    card: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
    },
    heading: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    sep: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.stat.bold,
      color: LIVE.textFaint,
      marginBottom: 18,
    },
    when: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textMuted,
      textAlign: 'center',
    },
    whenUnknown: {
      fontSize: 14,
      color: LIVE.textMuted,
    },
    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: LIVE.glassDark,
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    topic: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    notifyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: LIVE.goldLt,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.sm,
    },
    notifyBtnOn: {
      backgroundColor: LIVE.sageLt,
    },
    notifyLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: LIVE.inkPin,
    },
    hint: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textFaint,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 17,
    },
  });
}

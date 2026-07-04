import { Bell, BellOff, CalendarClock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLiveClassCountdown } from '../../hooks/useLiveClassCountdown';
import { useLiveClassReminder } from '../../hooks';
import type { LiveClass } from '../../api/liveClasses';
import { useTheme } from '../../theme';

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
    <View style={styles.root}>
      <CalendarClock size={32} color={theme.colors.brand.primary} />
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
        <Text style={styles.when}>
          {new Date(startsAt).toLocaleString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={toggleReminder}
        disabled={reminderMutation.isPending}
        style={[styles.notifyBtn, liveClass.reminderSet ? styles.notifyBtnOn : null]}
      >
        {liveClass.reminderSet ? (
          <BellOff size={18} color={theme.colors.brand.onPrimary} />
        ) : (
          <Bell size={18} color={theme.colors.brand.onPrimary} />
        )}
        <Text style={styles.notifyLabel}>
          {liveClass.reminderSet ? t('reminderOn') : t('notifyMe')}
        </Text>
      </Pressable>

      <Text style={styles.hint}>
        {countdown.isPast ? t('waitingForHost') : t('scheduledHint')}
      </Text>
    </View>
  );
}

function CountdownUnit({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createUnitStyles(theme), [theme]);

  return (
    <View style={styles.unit}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createUnitStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    unit: { alignItems: 'center', minWidth: 52 },
    value: {
      ...theme.typography.presets.h2,
      color: theme.colors.text.primary,
      fontVariant: ['tabular-nums'],
    },
    label: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textTransform: 'uppercase',
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
      backgroundColor: '#0b1020',
    },
    heading: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    sep: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.tertiary,
      marginBottom: theme.spacing.lg,
    },
    when: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    whenUnknown: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    notifyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.sm,
    },
    notifyBtnOn: {
      backgroundColor: theme.colors.semantic.success,
    },
    notifyLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.onPrimary,
    },
    hint: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}

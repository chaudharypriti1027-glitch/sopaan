import { Bell, BellOff, BookOpen, CalendarClock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { NumText } from '../NumText';
import { usePremiumDialog } from '../premium';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useLiveClassCountdown } from '../../hooks/useLiveClassCountdown';
import { useLiveClassReminder } from '../../hooks';
import type { LiveClass } from '../../api/liveClasses';
import { formatLiveClassWhenLong } from '../../content/liveClassesContent';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

type LiveClassScheduledPanelProps = {
  liveClass: LiveClass;
};

const ICON_STROKE = 1.9;

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function LiveClassScheduledPanel({ liveClass }: LiveClassScheduledPanelProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const { locale } = useFormat();
  const { alert } = usePremiumDialog();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reminderMutation = useLiveClassReminder();
  const startsAt = liveClass.startsAt ?? liveClass.scheduledAt;
  const countdown = useLiveClassCountdown(startsAt);

  const toggleReminder = () => {
    reminderMutation.mutate(
      { id: liveClass.id, enabled: !liveClass.reminderSet },
      {
        onSuccess: () =>
          alert({
            title: liveClass.reminderSet ? t('reminderRemoved') : t('reminderSet'),
            message: liveClass.reminderSet ? t('reminderRemovedBody') : t('reminderSetBody'),
            icon: 'bell',
            iconTone: 'gold',
          }),
        onError: (err) =>
          alert({
            title: t('reminderFailed'),
            message: getUserFacingMessage(err),
            icon: 'info',
            iconTone: 'coral',
          }),
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
        <View style={styles.iconWell}>
          <CalendarClock size={30} color={LIVE.goldLt} strokeWidth={ICON_STROKE} />
        </View>
        <Text style={styles.eyebrow}>{t('startsIn')}</Text>

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
          <Text style={styles.when}>{formatLiveClassWhenLong(startsAt, locale)}</Text>
        ) : null}

        {liveClass.topic ? (
          <View style={styles.topicRow}>
            <BookOpen size={15} color={LIVE.goldLt} strokeWidth={ICON_STROKE} />
            <Text style={styles.topic} numberOfLines={2}>
              {liveClass.topic}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liveClass.reminderSet ? t('reminderOn') : t('notifyMe')}
          onPress={toggleReminder}
          disabled={reminderMutation.isPending}
          style={({ pressed }) => [
            styles.notifyBtn,
            liveClass.reminderSet && styles.notifyBtnOn,
            pressed && styles.notifyPressed,
          ]}
        >
          {liveClass.reminderSet ? (
            <BellOff size={18} color={LIVE.inkPin} strokeWidth={ICON_STROKE} />
          ) : (
            <Bell size={18} color={LIVE.inkPin} strokeWidth={ICON_STROKE} />
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
      <View style={styles.valueWell}>
        <NumText style={styles.value}>{value}</NumText>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createUnitStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    unit: { alignItems: 'center', gap: 6, minWidth: 54 },
    valueWell: {
      minWidth: 54,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    value: {
      fontSize: 26,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    label: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
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
      top: '16%',
      alignSelf: 'center',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    card: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
    },
    iconWell: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.32)',
      marginBottom: 4,
    },
    eyebrow: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: LIVE.goldLt,
      textAlign: 'center',
    },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 4,
    },
    sep: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.stat.bold,
      color: LIVE.textFaint,
      marginTop: 12,
      paddingHorizontal: 2,
    },
    when: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 300,
    },
    whenUnknown: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.textMuted,
      textAlign: 'center',
    },
    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: 320,
      backgroundColor: LIVE.glassDark,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: LIVE.glassBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    topic: {
      flexShrink: 1,
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 18,
    },
    notifyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      alignSelf: 'stretch',
      maxWidth: 340,
      backgroundColor: LIVE.goldLt,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.xl,
      marginTop: 8,
      minHeight: 52,
    },
    notifyBtnOn: {
      backgroundColor: LIVE.sageLt,
    },
    notifyPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    notifyLabel: {
      fontSize: 15,
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
      maxWidth: 300,
      lineHeight: 18,
      marginTop: 2,
    },
  });
}

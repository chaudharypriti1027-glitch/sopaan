import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Calendar, GraduationCap, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { PROFILE, profileCard } from './profileTheme';

function daysUntilExam(examDate?: string): number | null {
  if (!examDate) {
    return null;
  }

  const target = new Date(examDate);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

type ProfileGoalStripProps = {
  profile: Profile;
  onEditPress?: () => void;
};

export function ProfileGoalStrip({ profile, onEditPress }: ProfileGoalStripProps) {
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const daysLeft = daysUntilExam(profile.examDate);
  const examLabel = profile.targetExam?.trim();
  const hasGoal = Boolean(examLabel || profile.examDate);

  if (!hasGoal) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.setGoal')}
        onPress={onEditPress}
        style={({ pressed }) => [styles.card, styles.empty, pressed && styles.pressed]}
      >
        <View style={styles.emptyIcon}>
          <GraduationCap size={18} color={PROFILE.goldDeep} strokeWidth={1.75} />
        </View>
        <View style={styles.emptyText}>
          <Text style={styles.emptyTitle}>{t('profile.setGoal')}</Text>
          <Text style={styles.emptyHint}>{t('profile.goalStripHint')}</Text>
        </View>
        <Pencil size={16} color={PROFILE.muted} strokeWidth={1.75} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.goal')}
      onPress={onEditPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.leadIcon}>
        <GraduationCap size={18} color={PROFILE.navy} strokeWidth={1.75} />
      </View>
      <View style={styles.body}>
        <Text style={styles.exam} numberOfLines={1}>
          {examLabel ?? t('profile.targetExam')}
        </Text>
        {profile.examDate ? (
          <View style={styles.dateRow}>
            <Calendar size={11} color={PROFILE.muted} strokeWidth={1.75} />
            <Text style={styles.date}>
              {formatDate(profile.examDate, { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        ) : null}
      </View>
      {daysLeft != null ? (
        <View style={styles.countdown}>
          <Text style={styles.countdownValue}>{daysLeft}</Text>
          <Text style={styles.countdownLabel}>{t('profile.daysLeft')}</Text>
        </View>
      ) : (
        <Pencil size={16} color={PROFILE.faint} strokeWidth={1.75} />
      )}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      ...profileCard(theme),
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.995 }],
    },
    empty: {
      borderStyle: 'dashed',
      borderColor: PROFILE.goldLt,
      backgroundColor: 'rgba(244,235,216,0.45)',
    },
    emptyIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: PROFILE.goldSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      flex: 1,
      gap: 2,
    },
    emptyTitle: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
    },
    emptyHint: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
    },
    leadIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: '#E9EBF3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      gap: 3,
    },
    exam: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
      letterSpacing: -0.2,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    date: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
    },
    countdown: {
      alignItems: 'center',
      minWidth: 44,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(35,42,77,0.06)',
    },
    countdownValue: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: PROFILE.navy,
      lineHeight: 18,
    },
    countdownLabel: {
      fontSize: 9,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PROFILE.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
  });
}

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { CountUpText } from './CountUpText';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { PROFILE, profileCard } from './profileTheme';

function computeCompletion(profile: Profile, t: (key: string) => string) {
  const checks = [
    Boolean(profile.name?.trim()),
    Boolean(profile.avatarUrl),
    Boolean(profile.targetExam?.trim()),
    Boolean(profile.examDate),
    Boolean(profile.state?.trim()),
    Boolean(profile.category),
    Boolean(profile.educationLevel),
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  const hint =
    !profile.examDate && !profile.avatarUrl
      ? t('profile.completionHintBoth')
      : !profile.examDate
        ? t('profile.completionHintExam')
        : !profile.avatarUrl
          ? t('profile.completionHintPhoto')
          : t('profile.completionHintAlmost');

  return {
    pct: Math.round((done / total) * 100),
    hint,
  };
}

type ProfileCompletionCardProps = {
  profile: Profile;
  replayKey?: number;
};

export function ProfileCompletionCard({ profile, replayKey = 0 }: ProfileCompletionCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { pct, hint } = useMemo(() => computeCompletion(profile, t), [profile, t]);

  if (pct >= 100) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{t('profile.completeProfile')}</Text>
        <CountUpText
          value={pct}
          replayKey={replayKey}
          suffix="%"
          style={styles.pct}
        />
      </View>
      <AnimatedProgressBar
        progress={pct / 100}
        replayKey={replayKey}
        colors={['#6C9A8A', '#4C7264']}
        height={8}
        delayMs={500}
      />
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      paddingVertical: 15,
      paddingHorizontal: 16,
      ...profileCard(theme),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 9,
    },
    title: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
    },
    pct: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: PROFILE.goldDeep,
    },
    hint: {
      marginTop: 8,
      fontSize: 10.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
    },
  });
}

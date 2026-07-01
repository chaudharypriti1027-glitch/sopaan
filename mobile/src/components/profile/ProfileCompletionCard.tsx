import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { homePremiumCard } from '../home/homeStyles';

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
};

export function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
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
        <NumText style={styles.pct}>{pct}%</NumText>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={['#454C79', '#232A4D']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      paddingVertical: 15,
      paddingHorizontal: 16,
      ...homePremiumCard(theme),
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
      color: theme.colors.text.primary,
    },
    pct: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: theme.colors.brand.primary,
    },
    track: {
      height: 8,
      borderRadius: 99,
      backgroundColor: theme.colors.border.subtle,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 99,
    },
    hint: {
      marginTop: 8,
      fontSize: 10.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
  });
}

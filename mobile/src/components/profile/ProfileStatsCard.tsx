import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { homePremiumCard } from '../home/homeStyles';

type ProfileStatsCardProps = {
  profile: Profile;
};

function formatStat(value: number | null | undefined, fallback = '—') {
  if (value == null) {
    return fallback;
  }
  return String(value);
}

export function ProfileStatsCard({ profile }: ProfileStatsCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const stats = [
    { label: t('home.allIndiaRank'), value: formatStat(profile.rank), color: theme.colors.text.primary },
    { label: t('profile.dayStreakStat'), value: formatStat(profile.streak, '0'), color: theme.colors.accent.goldOn },
    { label: t('profile.levelStat'), value: formatStat(profile.level, '1'), color: theme.colors.brand.primary },
    { label: t('profile.coins'), value: formatStat(profile.coins, '0'), color: theme.colors.accent.goldOn },
  ];

  return (
    <View style={styles.card}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.stat, index > 0 && styles.statBorder]}>
          <NumText style={[styles.value, { color: stat.color }]}>{stat.value}</NumText>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 6,
      ...homePremiumCard(theme),
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    statBorder: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: '#F4F5FA',
    },
    value: {
      fontSize: 19,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
    },
    label: {
      marginTop: 3,
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { ProfileSummary } from '../../api/me';
import type { Profile } from '../../types/auth';
import { CountUpText } from './CountUpText';
import { PROFILE, profileCard } from './profileTheme';

type ProfileStatsCardProps = {
  profile: Profile;
  summary?: ProfileSummary;
  replayKey?: number;
};

export function ProfileStatsCard({
  profile,
  summary,
  replayKey = 0,
}: ProfileStatsCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accuracy = summary?.accuracy ?? null;
  const streak = summary?.streak ?? profile.streak ?? 0;
  const level = summary?.level ?? profile.level ?? 1;
  const coins = summary?.coins ?? profile.coins ?? 0;

  const stats = [
    {
      label: t('profile.accuracyStat'),
      value: accuracy,
      suffix: '%' as const,
      color: PROFILE.ink,
    },
    {
      label: t('profile.dayStreakStat'),
      value: streak,
      color: PROFILE.goldDeep,
    },
    {
      label: t('profile.levelStat'),
      value: level,
      color: PROFILE.navy,
    },
    {
      label: t('profile.coins'),
      value: coins,
      color: PROFILE.goldDeep,
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.accentLine} />
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.statWrap}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.stat}>
            <CountUpText
              value={stat.value}
              replayKey={replayKey}
              suffix={stat.suffix}
              style={[styles.value, { color: stat.color }]}
            />
            <Text style={styles.label}>{stat.label}</Text>
          </View>
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
      overflow: 'hidden',
      ...profileCard(theme),
    },
    accentLine: {
      position: 'absolute',
      top: 0,
      left: '18%',
      right: '18%',
      height: 2,
      borderRadius: 1,
      backgroundColor: PROFILE.goldLt,
      opacity: 0.55,
    },
    statWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    divider: {
      position: 'absolute',
      left: 0,
      top: '14%',
      height: '72%',
      width: 1,
      backgroundColor: PROFILE.hair,
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
      color: PROFILE.muted,
      textAlign: 'center',
    },
  });
}

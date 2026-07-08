import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Coins, Flame, Target, Zap } from 'lucide-react-native';
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
      icon: Target,
      iconBg: '#E9EBF3',
      iconColor: PROFILE.navy,
    },
    {
      label: t('profile.dayStreakStat'),
      value: streak,
      color: PROFILE.goldDeep,
      icon: Flame,
      iconBg: PROFILE.goldSoft,
      iconColor: PROFILE.goldDeep,
    },
    {
      label: t('profile.levelStat'),
      value: level,
      color: PROFILE.navy,
      icon: Zap,
      iconBg: '#E9EBF3',
      iconColor: PROFILE.navy,
    },
    {
      label: t('profile.coins'),
      value: coins,
      color: PROFILE.goldDeep,
      icon: Coins,
      iconBg: PROFILE.goldSoft,
      iconColor: PROFILE.goldDeep,
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.accentLine} />
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <View key={stat.label} style={styles.statWrap}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.stat}>
              <View style={[styles.iconWrap, { backgroundColor: stat.iconBg }]}>
                <Icon size={14} color={stat.iconColor} strokeWidth={1.85} />
              </View>
              <CountUpText
                value={stat.value}
                replayKey={replayKey}
                suffix={stat.suffix}
                style={[styles.value, { color: stat.color }]}
              />
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 4,
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
      gap: 4,
    },
    iconWrap: {
      width: 26,
      height: 26,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 18,
      lineHeight: 21,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
    },
    label: {
      fontSize: 9.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
      textAlign: 'center',
    },
  });
}

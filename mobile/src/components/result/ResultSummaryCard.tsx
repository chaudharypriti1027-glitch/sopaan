import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Clock, SkipForward, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { resultCard, RESULT_UI } from './resultTheme';

type ResultSummaryCardProps = {
  correct: number;
  wrong: number;
  skipped: number;
  durationLabel: string;
};

type StatItem = {
  key: string;
  icon: typeof Check;
  value: string;
  label: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
};

export function ResultSummaryCard({
  correct,
  wrong,
  skipped,
  durationLabel,
}: ResultSummaryCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const stats: StatItem[] = [
    {
      key: 'correct',
      icon: Check,
      value: String(correct),
      label: t('result.correct'),
      iconBg: RESULT_UI.sageSoft,
      iconColor: RESULT_UI.sageDeep,
      valueColor: RESULT_UI.sageDeep,
    },
    {
      key: 'wrong',
      icon: X,
      value: String(wrong),
      label: t('result.wrong'),
      iconBg: RESULT_UI.redSoft,
      iconColor: RESULT_UI.red,
      valueColor: RESULT_UI.red,
    },
    {
      key: 'skipped',
      icon: SkipForward,
      value: String(skipped),
      label: t('result.skipped'),
      iconBg: RESULT_UI.navySoft,
      iconColor: RESULT_UI.navy,
    },
    {
      key: 'time',
      icon: Clock,
      value: durationLabel,
      label: t('result.time'),
      iconBg: RESULT_UI.goldSoft,
      iconColor: RESULT_UI.goldDeep,
      valueColor: RESULT_UI.goldDeep,
    },
  ];

  return (
    <View style={styles.card}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <View key={stat.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
            <View style={[styles.icon, { backgroundColor: stat.iconBg }]}>
              <Icon size={17} color={stat.iconColor} strokeWidth={2.2} />
            </View>
            <NumText style={[styles.value, stat.valueColor ? { color: stat.valueColor } : null]}>
              {stat.value}
            </NumText>
            <Text style={styles.label}>{stat.label}</Text>
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
      paddingVertical: 16,
      paddingHorizontal: 6,
      ...resultCard(),
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    cellBorder: {
      borderLeftWidth: 1,
      borderLeftColor: RESULT_UI.hair,
    },
    icon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },
    value: {
      fontSize: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: RESULT_UI.ink,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: RESULT_UI.muted,
      marginTop: 2,
    },
  });
}

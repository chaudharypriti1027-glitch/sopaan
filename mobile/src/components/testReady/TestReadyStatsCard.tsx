import { Gauge, ListChecks, Sparkles, Timer } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { resultCard, RESULT_UI } from '../result/resultTheme';

type StatCell = {
  key: string;
  icon: typeof ListChecks;
  value: string;
  label: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
};

type TestReadyStatsCardProps = {
  questionCount: number;
  questionsLabel: string;
  durationLabel: string;
  durationCaption: string;
  difficultyLabel: string;
  levelCaption: string;
  aiLabel: string;
  delay?: number;
};

export function TestReadyStatsCard({
  questionCount,
  questionsLabel,
  durationLabel,
  durationCaption,
  difficultyLabel,
  levelCaption,
  aiLabel,
  delay = 380,
}: TestReadyStatsCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const stats: StatCell[] = [
    {
      key: 'questions',
      icon: ListChecks,
      value: String(questionCount),
      label: questionsLabel,
      iconBg: RESULT_UI.navySoft,
      iconColor: RESULT_UI.navy,
    },
    {
      key: 'duration',
      icon: Timer,
      value: durationLabel,
      label: durationCaption,
      iconBg: RESULT_UI.goldSoft,
      iconColor: RESULT_UI.goldDeep,
      valueColor: RESULT_UI.goldDeep,
    },
    {
      key: 'level',
      icon: Gauge,
      value: difficultyLabel,
      label: levelCaption,
      iconBg: RESULT_UI.sageSoft,
      iconColor: RESULT_UI.sageDeep,
      valueColor: RESULT_UI.sageDeep,
    },
    {
      key: 'ai',
      icon: Sparkles,
      value: 'AI',
      label: aiLabel,
      iconBg: 'rgba(194,154,78,0.16)',
      iconColor: RESULT_UI.goldDeep,
      valueColor: RESULT_UI.goldDeep,
    },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(440).delay(delay)} style={styles.card}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <View key={stat.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
            <View style={[styles.icon, { backgroundColor: stat.iconBg }]}>
              <Icon size={17} color={stat.iconColor} strokeWidth={2.2} />
            </View>
            <NumText
              style={[styles.value, stat.valueColor ? { color: stat.valueColor } : null]}
              numberOfLines={1}
            >
              {stat.value}
            </NumText>
            <Text style={styles.label} numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      paddingVertical: 18,
      paddingHorizontal: 4,
      ...resultCard(),
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
      paddingHorizontal: 4,
    },
    cellBorder: {
      borderLeftWidth: 1,
      borderLeftColor: RESULT_UI.hair,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    value: {
      fontSize: 17,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: RESULT_UI.ink,
      textAlign: 'center',
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: RESULT_UI.muted,
      marginTop: 3,
      textAlign: 'center',
    },
  });
}

import { Flame, Sparkles, Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';
import { practiceFadeInDown } from './practiceMotion';

type PracticeStat = {
  value: string;
  label: string;
  tone: 'indigo' | 'green' | 'amber';
};

const STAT_ICONS = {
  indigo: Trophy,
  green: Sparkles,
  amber: Flame,
} as const;

type PracticeStatsRowProps = {
  stats: PracticeStat[];
};

export function PracticeStatsRow({ stats }: PracticeStatsRowProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row}>
      {stats.map((stat, index) => {
        const Icon = STAT_ICONS[stat.tone];
        return (
          <Animated.View
            key={stat.label}
            entering={practiceFadeInDown(index, 70)}
            style={[
              styles.card,
              stat.tone === 'indigo' && styles.cardIndigo,
              stat.tone === 'green' && styles.cardGreen,
              stat.tone === 'amber' && styles.cardAmber,
            ]}
          >
            <Icon
              size={14}
              color={
                stat.tone === 'indigo'
                  ? PRACTICE_UI.statIndigo
                  : stat.tone === 'green'
                    ? PRACTICE_UI.statGreen
                    : PRACTICE_UI.statAmber
              }
              strokeWidth={2.2}
            />
            <NumText
              style={[
                styles.value,
                stat.tone === 'indigo' && styles.valueIndigo,
                stat.tone === 'green' && styles.valueGreen,
                stat.tone === 'amber' && styles.valueAmber,
              ]}
            >
              {stat.value}
            </NumText>
            <Text style={styles.label}>{stat.label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    card: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.06)',
      ...platformShadow({
        color: '#000000',
        offsetY: 2,
        opacity: 0.04,
        radius: 8,
        elevation: 1,
      }),
    },
    cardIndigo: {
      backgroundColor: PRACTICE_UI.statIndigoBg,
    },
    cardGreen: {
      backgroundColor: PRACTICE_UI.statGreenBg,
    },
    cardAmber: {
      backgroundColor: PRACTICE_UI.statAmberBg,
    },
    value: {
      fontSize: 22,
      fontWeight: '800',
    },
    valueIndigo: {
      color: PRACTICE_UI.statIndigo,
    },
    valueGreen: {
      color: PRACTICE_UI.statGreen,
    },
    valueAmber: {
      color: PRACTICE_UI.statAmber,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: PRACTICE_UI.tabMuted,
      textAlign: 'center',
      lineHeight: 13,
    },
  });
}

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';

type PracticeStat = {
  value: string;
  label: string;
  tone: 'indigo' | 'green' | 'amber';
};

type PracticeStatsRowProps = {
  stats: PracticeStat[];
};

export function PracticeStatsRow({ stats }: PracticeStatsRowProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[
            styles.card,
            stat.tone === 'indigo' && styles.cardIndigo,
            stat.tone === 'green' && styles.cardGreen,
            stat.tone === 'amber' && styles.cardAmber,
          ]}
        >
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
        </View>
      ))}
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
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
      fontSize: 11,
      color: PRACTICE_UI.tabMuted,
      textAlign: 'center',
      lineHeight: 14,
    },
  });
}

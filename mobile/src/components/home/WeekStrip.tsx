import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';

type WeekStripProps = {
  /** Current streak length in days — used to light up the most recent active days. */
  streakDays: number;
};

function buildWeek(streakDays: number) {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIndex);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isToday = i === dayIndex;
    const isPast = i <= dayIndex;
    const daysAgo = dayIndex - i;
    const active = isPast && streakDays > 0 && daysAgo < streakDays;
    return {
      key: date.toISOString(),
      letter: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      num: date.getDate(),
      isToday,
      active,
    };
  });
}

export function WeekStrip({ streakDays }: WeekStripProps) {
  const days = useMemo(() => buildWeek(streakDays), [streakDays]);

  return (
    <View style={styles.row} testID="home-week-strip">
      {days.map((day) => (
        <View key={day.key} style={[styles.cell, day.isToday && styles.cellToday]}>
          <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.letter}</Text>
          <NumText style={[styles.num, day.isToday && styles.numToday]}>{day.num}</NumText>
          <View
            style={[
              styles.dot,
              day.active && !day.isToday && styles.dotActive,
              day.isToday && styles.dotToday,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 18,
    zIndex: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cellToday: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  letter: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  letterToday: {
    color: '#232A4D',
  },
  num: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  numToday: {
    color: '#1A1F3B',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#C29A4E',
  },
  dotToday: {
    backgroundColor: '#C29A4E',
  },
});

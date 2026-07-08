import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { HOME_UI } from './homeTheme';

type WeekStripProps = {
  streakDays: number;
};

function buildWeek(streakDays: number) {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7;
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
        <View
          key={day.key}
          style={[
            styles.cell,
            day.isToday && styles.cellToday,
            day.active && !day.isToday && styles.cellActive,
          ]}
        >
          <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.letter}</Text>
          <NumText style={[styles.num, day.isToday && styles.numToday]}>{day.num}</NumText>
          <View
            style={[
              styles.tick,
              day.active && !day.isToday && styles.tickActive,
              day.isToday && styles.tickToday,
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
    gap: 4,
    marginTop: 14,
    zIndex: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cellActive: {
    backgroundColor: 'rgba(194,154,78,0.12)',
  },
  cellToday: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  letter: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.2,
  },
  letterToday: {
    color: HOME_UI.accent,
  },
  num: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
  },
  numToday: {
    color: HOME_UI.accent,
  },
  tick: {
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tickActive: {
    backgroundColor: HOME_UI.goldLt,
  },
  tickToday: {
    backgroundColor: HOME_UI.gold,
  },
});

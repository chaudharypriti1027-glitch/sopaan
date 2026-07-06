import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
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
          {day.isToday ? (
            <LinearGradient
              colors={['#FFFFFF', '#F3EEE2']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.todayFill}
            />
          ) : null}
          <View style={day.isToday ? styles.todaySheen : undefined} />
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
    gap: 5,
    marginTop: 16,
    zIndex: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
    position: 'relative',
  },
  cellActive: {
    backgroundColor: 'rgba(194,154,78,0.1)',
    borderColor: 'rgba(194,154,78,0.24)',
  },
  cellToday: {
    borderColor: 'rgba(255,255,255,0.9)',
    ...platformShadow({ color: '#000000', offsetY: 5, opacity: 0.16, radius: 10, elevation: 3 }),
  },
  todayFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  todaySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  letter: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.48)',
    letterSpacing: 0.3,
    zIndex: 1,
  },
  letterToday: {
    color: HOME_UI.accent,
  },
  num: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.86)',
    zIndex: 1,
  },
  numToday: {
    color: HOME_UI.accent,
  },
  tick: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 1,
  },
  tickActive: {
    backgroundColor: HOME_UI.goldLt,
  },
  tickToday: {
    backgroundColor: HOME_UI.gold,
  },
});

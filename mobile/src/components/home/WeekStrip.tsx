import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useFormat } from '../../i18n/useFormat';
import { HOME_UI } from './homeTheme';

type WeekStripProps = {
  streakDays: number;
};

function localeTag(locale: string) {
  if (locale === 'hi') return 'hi-IN';
  if (locale === 'gu') return 'gu-IN';
  return 'en-IN';
}

function buildWeek(streakDays: number, locale: string) {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIndex);
  const tag = localeTag(locale);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isToday = i === dayIndex;
    const isPast = i <= dayIndex;
    const daysAgo = dayIndex - i;
    const active = isPast && streakDays > 0 && daysAgo < streakDays;
    return {
      key: date.toISOString(),
      letter: date.toLocaleDateString(tag, { weekday: 'narrow' }),
      num: date.getDate(),
      isToday,
      active,
    };
  });
}

export function WeekStrip({ streakDays }: WeekStripProps) {
  const { locale } = useFormat();
  const days = useMemo(() => buildWeek(streakDays, locale), [locale, streakDays]);

  return (
    <View style={styles.row} testID="home-week-strip">
      {days.map((day) => (
        <View
          key={day.key}
          style={[
            styles.cell,
            day.active && !day.isToday && styles.cellActive,
            day.isToday && styles.cellToday,
          ]}
        >
          <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.letter}</Text>
          <NumText style={[styles.num, day.isToday && styles.numToday]}>{day.num}</NumText>
          <View
            style={[
              styles.tick,
              day.active && !day.isToday && styles.tickActive,
              day.isToday && styles.tickToday,
              !day.active && !day.isToday && styles.tickMuted,
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
    gap: 6,
    marginTop: 20,
    zIndex: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cellActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cellToday: {
    backgroundColor: HOME_UI.goldLt,
    borderColor: 'transparent',
    shadowColor: HOME_UI.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  letter: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  letterToday: {
    fontWeight: '700',
    color: '#463612',
  },
  num: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  numToday: {
    fontWeight: '800',
    color: '#251C08',
  },
  tick: {
    width: 14,
    height: 3,
    borderRadius: 99,
  },
  tickMuted: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tickActive: {
    backgroundColor: HOME_UI.sage,
  },
  tickToday: {
    backgroundColor: '#251C08',
  },
});

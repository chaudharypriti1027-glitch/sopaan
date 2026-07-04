import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, BellOff } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, DateChip, QueryStateView, Screen, SectionTitle } from '../../components';
import { listReminderKeys, toggleReminder } from '../../calendar/reminders';
import { useExamCalendar, useNetworkStatus } from '../../hooks';
import type { ExamCalendarEntry } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type CalendarNav = NativeStackNavigationProp<MainStackParamList, 'ExamCalendar'>;

type CalendarGroup = 'openJobs' | 'upcoming' | 'results' | 'other';

const GROUP_ORDER: CalendarGroup[] = ['openJobs', 'upcoming', 'results', 'other'];

function mapGroup(type: ExamCalendarEntry['type']): CalendarGroup {
  if (type === 'open' || type === 'apply') return 'openJobs';
  if (type === 'result') return 'results';
  if (type === 'other') return 'other';
  return 'upcoming';
}

function formatChipDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function CalendarRow({
  entry,
  reminded,
  onToggleReminder,
  onPress,
}: {
  entry: ExamCalendarEntry;
  reminded: boolean;
  onToggleReminder: () => void;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <DateChip label={formatChipDate(entry.date)} selected={false} />
      <View style={styles.info}>
        <Text style={styles.exam}>{entry.examName}</Text>
        <Text style={styles.label}>{entry.label}</Text>
        <Text style={styles.date}>{formatFullDate(entry.date)}</Text>
      </View>
      <Pressable onPress={onToggleReminder} hitSlop={10} style={styles.bell}>
        {reminded ? (
          <Bell size={18} color={theme.colors.brand.primary} fill={theme.colors.brand.primary} />
        ) : (
          <BellOff size={18} color={theme.colors.text.tertiary} />
        )}
      </Pressable>
    </Pressable>
  );
}

export function ExamCalendarScreen() {
  const navigation = useNavigation<CalendarNav>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const calendarQuery = useExamCalendar({ limit: 50 });
  const [reminderKeys, setReminderKeys] = useState<string[]>([]);

  const groupLabels = useMemo(
    () => ({
      openJobs: t('examCalendar.openJobs'),
      upcoming: t('examCalendar.upcoming'),
      results: t('examCalendar.results'),
      other: t('examCalendar.other'),
    }),
    [t],
  );

  const loadReminders = useCallback(async () => {
    setReminderKeys(await listReminderKeys());
  }, []);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const grouped = useMemo(() => {
    const groups: Record<CalendarGroup, ExamCalendarEntry[]> = {
      openJobs: [],
      upcoming: [],
      results: [],
      other: [],
    };

    for (const entry of calendarQuery.data?.items ?? []) {
      groups[mapGroup(entry.type)].push(entry);
    }

    return groups;
  }, [calendarQuery.data]);

  const handleToggleReminder = async (entry: ExamCalendarEntry) => {
    await toggleReminder(entry.examId, entry.date);
    await loadReminders();
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={calendarQuery.isRefetching}
            onRefresh={() => calendarQuery.refetch()}
          />
        ),
      }}
    >
      <SectionTitle title={t('examCalendar.title')} subtitle={t('examCalendar.subtitle')} />

      <QueryStateView
        isLoading={calendarQuery.isLoading}
        isError={calendarQuery.isError}
        isFetching={calendarQuery.isFetching}
        isOffline={isOffline}
        hasData={(calendarQuery.data?.items.length ?? 0) > 0}
        onRetry={() => void calendarQuery.refetch()}
      >
        {GROUP_ORDER.map((group) => {
          const items = grouped[group];
          if (!items.length) return null;

          return (
            <View key={group} style={styles.section}>
              <SectionTitle title={groupLabels[group]} />
              <Card style={styles.groupCard}>
                {items.map((entry) => {
                  const key = `${entry.examId}:${entry.date}`;
                  return (
                    <CalendarRow
                      key={key}
                      entry={entry}
                      reminded={reminderKeys.includes(key)}
                      onToggleReminder={() => handleToggleReminder(entry)}
                      onPress={() =>
                        navigation.navigate('ExamDetail', { examId: entry.examId })
                      }
                    />
                  );
                })}
              </Card>
            </View>
          );
        })}
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    section: { gap: theme.spacing.md },
    groupCard: { gap: theme.spacing.md },
  });
}

function createRowStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    pressed: { opacity: 0.92 },
    info: { flex: 1, gap: theme.spacing.xs },
    exam: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    label: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    date: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    bell: { paddingTop: theme.spacing.xs },
  });
}

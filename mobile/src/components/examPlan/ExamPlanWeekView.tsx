import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Text } from '..';
import type { ExamPlanWeekDay } from '../../api/examPlan';
import { useTheme } from '../../theme';
import { HOME_UI } from '../home/homeTheme';

type ExamPlanWeekViewProps = {
  days: ExamPlanWeekDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function ExamPlanWeekView({ days, selectedDate, onSelectDate }: ExamPlanWeekViewProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const selected = days.find((day) => day.date === selectedDate) ?? days.find((day) => day.isToday) ?? days[0];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        testID="exam-plan-week-strip"
      >
        {days.map((day) => {
          const active = day.date === selected?.date;
          const dayNum = day.date.slice(-2);

          return (
            <Pressable
              key={day.date}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelectDate(day.date)}
              style={[styles.dayChip, active && styles.dayChipActive, day.isToday && !active && styles.dayChipToday]}
              testID={`exam-plan-day-${day.date}`}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day.dayLabel}</Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>{dayNum}</Text>
              {day.total > 0 ? (
                <View style={[styles.dot, day.progressPct === 100 && styles.dotDone]} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {selected ? (
        <Card style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <View style={styles.dayHeaderCopy}>
              <Text style={styles.dayTheme}>{selected.theme}</Text>
              <Text style={styles.dayMeta}>
                {t('examPlan.dayTarget', { minutes: selected.targetMinutes })}
                {selected.total > 0
                  ? ` · ${t('examPlan.dayProgressShort', {
                      done: selected.completed,
                      total: selected.total,
                    })}`
                  : ''}
              </Text>
            </View>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>{selected.progressPct}%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[HOME_UI.goldLt, HOME_UI.gold]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${Math.max(selected.progressPct, 4)}%` }]}
            />
          </View>

          <View style={styles.taskList}>
            {selected.tasks.map((task, index) => (
              <View key={task.id ?? `${task.subject}-${index}`} style={styles.taskRow}>
                {task.completed ? (
                  <CheckCircle2 size={16} color={HOME_UI.sageDeep} strokeWidth={2.2} />
                ) : (
                  <Circle size={16} color={HOME_UI.muted} strokeWidth={2} />
                )}
                <View style={styles.taskCopy}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskDone]}>
                    {task.subject}
                    {task.topic ? ` · ${task.topic}` : ''}
                  </Text>
                  <Text style={styles.taskMeta}>
                    {task.durationMin} min · {task.type}
                    {!task.planned ? ` · ${t('examPlan.suggested')}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: theme.spacing.sm,
    },
    strip: {
      gap: 8,
      paddingVertical: 2,
    },
    dayChip: {
      width: 52,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    dayChipActive: {
      backgroundColor: HOME_UI.accent,
      borderColor: HOME_UI.accent,
    },
    dayChipToday: {
      borderColor: HOME_UI.gold,
    },
    dayLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.text.tertiary,
    },
    dayLabelActive: {
      color: 'rgba(255,255,255,0.72)',
    },
    dayNum: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text.primary,
    },
    dayNumActive: {
      color: '#FFFFFF',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: HOME_UI.gold,
      marginTop: 2,
    },
    dotDone: {
      backgroundColor: HOME_UI.sage,
    },
    dayCard: {
      gap: theme.spacing.sm,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    dayHeaderCopy: {
      flex: 1,
      gap: 3,
    },
    dayTheme: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    dayMeta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    pctBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: HOME_UI.goldSoft,
    },
    pctText: {
      fontSize: 12,
      fontWeight: '800',
      color: HOME_UI.goldDeep,
    },
    progressTrack: {
      height: 7,
      borderRadius: 99,
      backgroundColor: theme.colors.border.subtle,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 99,
    },
    taskList: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    taskCopy: {
      flex: 1,
      gap: 2,
    },
    taskTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    taskDone: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    taskMeta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}

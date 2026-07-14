import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, PlanTaskRow, SectionTitle } from '../../components';
import type { DailyRoutineTask } from '../../api/dailyRoutine';
import { useDailyRoutine } from '../../hooks/useDailyRoutine';
import { navigateHomeDeeplink } from '../../navigation/homeDeeplink';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyRoutineCardProps = {
  onOpenAffair?: (affairId: string) => void;
};

function openTask(task: DailyRoutineTask, navigation: Nav, onOpenAffair?: (affairId: string) => void) {
  if (task.deeplink) {
    if (task.affairId && task.kind === 'current_affair') {
      onOpenAffair?.(task.affairId);
    }
    navigateHomeDeeplink(navigation as never, task.deeplink);
    return;
  }

  if (task.affairId) {
    onOpenAffair?.(task.affairId);
    navigation.navigate('CurrentAffairReader', { affairId: task.affairId });
  }
}

export function DailyRoutineCard({ onOpenAffair }: DailyRoutineCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const routineQuery = useDailyRoutine();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const routine = routineQuery.data;
  if (!routine || routine.tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <SectionTitle
        title={t('dailyRoutine.title')}
        subtitle={t('dailyRoutine.subtitle', {
          completed: routine.progress.completed,
          total: routine.progress.total,
        })}
      />
      <Card style={styles.card}>
        <Text style={styles.headline}>{routine.headline}</Text>
        {routine.tips.length ? (
          <View style={styles.tips}>
            <View style={styles.tipsHeader}>
              <Sparkles size={14} color={theme.colors.brand.primary} />
              <Text style={styles.tipsTitle}>{t('dailyRoutine.examTips')}</Text>
            </View>
            {routine.tips.map((tip) => (
              <Text key={tip} style={styles.tip}>
                • {tip}
              </Text>
            ))}
          </View>
        ) : null}
        {routine.tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <PlanTaskRow
              title={task.title}
              subtitle={task.subtitle}
              completed={task.completed}
            />
            <Pressable
              style={styles.openBtn}
              onPress={() => {
                openTask(task, navigation, onOpenAffair);
              }}
            >
              <Text style={styles.openLabel}>{t('dailyRoutine.open')}</Text>
              <ChevronRight size={14} color={theme.colors.brand.primary} />
            </Pressable>
          </View>
        ))}
      </Card>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: theme.spacing.sm,
    },
    card: {
      gap: theme.spacing.sm,
    },
    headline: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    tips: {
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface.muted,
    },
    tipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    tipsTitle: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    tip: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    taskRow: {
      gap: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.subtle,
      paddingTop: theme.spacing.sm,
    },
    openBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      gap: 2,
      minHeight: theme.a11y.minTouchTarget,
      paddingHorizontal: theme.spacing.sm,
    },
    openLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
  });
}

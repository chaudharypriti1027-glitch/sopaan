import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Calendar, Dumbbell, Sparkles, Star, Target } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  AIGoldCard,
  Button,
  Card,
  FeatureScreenLayout,
  MilestoneNode,
  PlanTaskRow,
  PremiumHeroCard,
  PremiumSectionLabel,
  RankRing,
} from '../../components';
import { ExamPlanWeekView } from '../../components/examPlan/ExamPlanWeekView';
import { DailyRoutineCard } from '../../components/dailyRoutine/DailyRoutineCard';
import {
  useExamPlan,
  useGenerateDayPlan,
  useUpdatePlannerSession,
} from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { ApiError } from '../../api/errors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ExamPlanScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<Nav>();

  const planQuery = useExamPlan();
  const updateSession = useUpdatePlannerSession();
  const generatePlan = useGenerateDayPlan();

  useFocusEffect(
    useCallback(() => {
      void planQuery.refetch();
    }, [planQuery]),
  );

  const plan = planQuery.data;
  const [selectedWeekDate, setSelectedWeekDate] = useState<string | null>(null);

  const activeWeekDate =
    selectedWeekDate ??
    plan?.weeklySchedule?.find((day) => day.isToday)?.date ??
    plan?.today.date ??
    null;

  const handleToggleTask = (sessionId: string, completed: boolean) => {
    updateSession.mutate(
      { id: sessionId, input: { completed: !completed } },
      {
        onSuccess: () => {
          void planQuery.refetch();
        },
      },
    );
  };

  const handleGenerateToday = () => {
    if (!plan?.today.date) return;
    generatePlan.mutate(
      { date: plan.today.date },
      {
        onSuccess: () => {
          void planQuery.refetch();
        },
        onError: () => {
          Alert.alert(t('examPlan.generateFailed'));
        },
      },
    );
  };

  if (planQuery.isLoading) {
    return (
      <FeatureScreenLayout
        title={t('examPlan.title')}
        subtitle={t('examPlan.loading')}
        contentStyle={styles.centered}
      >
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </FeatureScreenLayout>
    );
  }

  if (planQuery.isError || !plan) {
    const apiError = planQuery.error as ApiError | null;
    const goalMissing = apiError?.code === 'GOAL_NOT_SET';
    const message = goalMissing
      ? t('examPlan.setGoalFirst')
      : apiError?.message ?? t('examPlan.loadFailed');

    return (
      <FeatureScreenLayout
        title={t('examPlan.title')}
        subtitle={goalMissing ? t('examPlan.setGoalFirst') : t('examPlan.loadFailed')}
        contentStyle={styles.emptyWrap}
      >
        <Text style={styles.empty}>{message}</Text>
        {goalMissing ? (
          <Button
            label={t('examPlan.openProfile')}
            onPress={() => navigation.navigate('AppTabs', { screen: 'Profile' })}
          />
        ) : (
          <Button
            label={t('examPlan.retry')}
            onPress={() => void planQuery.refetch()}
            loading={planQuery.isFetching}
          />
        )}
      </FeatureScreenLayout>
    );
  }

  const weeklySchedule = plan.weeklySchedule ?? [];
  const weekPlanProgress = plan.weekPlanProgress ?? {
    completed: 0,
    total: 0,
    progressPct: 0,
  };
  const aiAdvice = {
    ...plan.aiAdvice,
    dreamMessage:
      plan.aiAdvice.dreamMessage ??
      t('examPlan.dreamJobHint', { exam: plan.goal.examName }),
    focusAreas: plan.aiAdvice.focusAreas ?? [],
    physicalPrep: plan.aiAdvice.physicalPrep ?? [],
    dailyTargetMinutes: plan.aiAdvice.dailyTargetMinutes ?? 90,
    weeklyStrategy: plan.aiAdvice.weeklyStrategy ?? '',
    summary: plan.aiAdvice.summary ?? '',
  };

  const {
    goal,
    exam,
    roadmap,
    phases,
    today,
    weekProgress,
    physicalPrep,
    upcomingDates,
  } = plan;

  return (
    <FeatureScreenLayout
      title={t('examPlan.title')}
      subtitle={goal.examName}
      contentStyle={styles.content}
    >
      <PremiumHeroCard
        icon={<Target size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={exam?.category ?? t('examPlan.prepTrack')}
        title={goal.examName}
        stats={[
          {
            label: t('examPlan.daysLeft'),
            value: goal.daysLeft != null ? String(goal.daysLeft) : '—',
          },
          {
            label: t('examPlan.targetYear'),
            value: String(goal.targetYear),
          },
        ]}
      >
        <View style={styles.heroRow}>
          <RankRing
            value={roadmap.overallProgress ?? 0}
            max={100}
            label={t('examPlan.overallProgress')}
            size={96}
            variant="teal"
            trackColor="rgba(255,255,255,0.15)"
            accentColor="#F4D58D"
            labelColor="rgba(255,255,255,0.6)"
          />
          {goal.dateLabel ? (
            <View style={styles.examDateChip}>
              <Calendar size={14} color="#F4D58D" />
              <Text style={styles.examDateText}>{goal.dateLabel}</Text>
            </View>
          ) : null}
        </View>
      </PremiumHeroCard>

      <Card style={styles.dreamCard}>
        <View testID="exam-plan-dream-card">
        <View style={styles.dreamHeader}>
          <Star size={18} color={theme.colors.brand.primary} fill={theme.colors.brand.primary} />
          <Text style={styles.dreamTitle}>{t('examPlan.dreamJobTitle')}</Text>
        </View>
        <Text style={styles.dreamMessage}>{aiAdvice.dreamMessage}</Text>
        <Text style={styles.dreamHint}>{t('examPlan.dreamJobHint', { exam: goal.examName })}</Text>
        </View>
      </Card>

      <AIGoldCard style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <AIBadge />
          <Text style={styles.aiTitle}>{t('examPlan.aiSummary')}</Text>
        </View>
        <Text style={styles.aiSummary}>{aiAdvice.summary}</Text>
        {aiAdvice.focusAreas.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
        <Text style={styles.strategy}>{aiAdvice.weeklyStrategy}</Text>
      </AIGoldCard>

      <View style={styles.section}>
        <PremiumSectionLabel
          title={t('examPlan.weeklyPlan')}
          compact
        />
        <Text style={styles.weekProgressMeta}>
          {t('examPlan.weekPlanProgress', {
            completed: weekPlanProgress.completed,
            total: weekPlanProgress.total,
            pct: weekPlanProgress.progressPct,
          })}
        </Text>
        <Card style={styles.weekProgressCard}>
          <View style={styles.weekProgressTrack}>
            <View
              style={[
                styles.weekProgressFill,
                { width: `${Math.max(weekPlanProgress.progressPct, 4)}%` },
              ]}
            />
          </View>
          <Text style={styles.weekProgressMeta}>
            {t('examPlan.weeklySubtitle', {
              minutes: aiAdvice.dailyTargetMinutes,
              daysLeft: goal.daysLeft ?? '—',
            })}
          </Text>
        </Card>
        {weeklySchedule.length > 0 && activeWeekDate ? (
          <ExamPlanWeekView
            days={weeklySchedule}
            selectedDate={activeWeekDate}
            onSelectDate={setSelectedWeekDate}
          />
        ) : null}
        <Button
          label={t('examPlan.generateToday')}
          icon={<Sparkles size={16} color={theme.colors.brand.onPrimary} />}
          onPress={handleGenerateToday}
          loading={generatePlan.isPending}
        />
      </View>

      {exam ? (
        <View style={styles.section}>
          <PremiumSectionLabel title={t('examPlan.examDetails')} compact />
          <Card style={styles.detailCard}>
            {exam.description ? (
              <Text style={styles.body}>{exam.description}</Text>
            ) : null}
            {exam.eligibility?.education ? (
              <Text style={styles.metaLine}>
                {t('examPlan.eligibility')}: {exam.eligibility.education}
              </Text>
            ) : null}
            {exam.vacancies != null ? (
              <Text style={styles.metaLine}>
                {t('examPlan.vacancies')}: {exam.vacancies.toLocaleString('en-IN')}
              </Text>
            ) : null}
            {exam.stages.length > 0 ? (
              <View style={styles.stageList}>
                <Text style={styles.subheading}>{t('examPlan.stages')}</Text>
                {exam.stages.map((stage) => (
                  <Text key={stage.order} style={styles.metaLine}>
                    {stage.order}. {stage.name}
                  </Text>
                ))}
              </View>
            ) : null}
            {exam.cutoffs.length > 0 ? (
              <View style={styles.stageList}>
                <Text style={styles.subheading}>{t('examPlan.cutoffs')}</Text>
                {exam.cutoffs.slice(0, 4).map((cutoff) => (
                  <Text key={`${cutoff.year}-${cutoff.category}`} style={styles.metaLine}>
                    {cutoff.year} · {cutoff.category}: {cutoff.marks}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        </View>
      ) : null}

      <PremiumSectionLabel title={t('examPlan.roadmap')} compact />
      {roadmap.currentStage ? (
        <Text style={styles.weekProgressMeta}>{roadmap.currentStage}</Text>
      ) : null}
      <Card style={styles.journey}>
        {roadmap.stages.map((stage, index) => (
          <MilestoneNode
            key={stage.order}
            title={stage.name}
            subtitle={stage.tips[0]}
            status={stage.status}
            isLast={index === roadmap.stages.length - 1}
          />
        ))}
      </Card>

      {phases.length > 0 ? (
        <View style={styles.section}>
          <PremiumSectionLabel title={t('examPlan.phases')} compact />
          {phases.map((phase) => (
            <Card key={phase.order} style={styles.phaseCard}>
              <Text style={styles.phaseTitle}>
                {phase.order}. {phase.name} · {phase.durationWeeks}w
              </Text>
              <Text style={styles.body}>{phase.focus}</Text>
              {phase.milestones.map((milestone) => (
                <Text key={milestone} style={styles.bullet}>
                  • {milestone}
                </Text>
              ))}
            </Card>
          ))}
        </View>
      ) : null}

      {physicalPrep.hasPhysicalStage ? (
        <View style={styles.section}>
          <PremiumSectionLabel title={t('examPlan.physicalPrep')} compact />
          <Card style={styles.detailCard}>
            <View style={styles.physicalHeader}>
              <Dumbbell size={18} color={theme.colors.brand.primary} />
              <Text style={styles.subheading}>
                {physicalPrep.stageNames.join(', ')}
              </Text>
            </View>
            {(physicalPrep.tips.length ? physicalPrep.tips : aiAdvice.physicalPrep).map((tip) => (
              <Text key={tip} style={styles.bullet}>
                • {tip}
              </Text>
            ))}
            <Button
              label={t('examPlan.openPhysical')}
              variant="ghost"
              onPress={() => navigation.navigate('PhysicalTest')}
            />
          </Card>
        </View>
      ) : null}

      {(upcomingDates ?? []).length > 0 ? (
        <View style={styles.section}>
          <PremiumSectionLabel title={t('examPlan.upcomingDates')} compact />
          <Card>
            {upcomingDates.map((item) => (
              <Text key={`${item.label}-${item.date}`} style={styles.metaLine}>
                {formatDateLabel(item.date)} · {item.label}
              </Text>
            ))}
          </Card>
        </View>
      ) : null}

      <PremiumSectionLabel title={t('examPlan.todayTasks')} compact />
      <Text style={styles.weekProgressMeta}>
        {t('examPlan.weekProgress', {
          completed: weekProgress.completed,
          total: weekProgress.total,
          pct: weekProgress.progressPct,
        })}
      </Text>

      <DailyRoutineCard />

      <Card style={styles.tasksCard}>
        {today.sessions.length === 0 ? (
          <View style={styles.emptyTasks}>
            <Text style={styles.body}>{t('examPlan.noTasksToday')}</Text>
            <Button
              label={t('examPlan.generateToday')}
              icon={<Sparkles size={16} color={theme.colors.brand.onPrimary} />}
              onPress={handleGenerateToday}
              loading={generatePlan.isPending}
            />
          </View>
        ) : (
          today.sessions.map((session) => (
            <PlanTaskRow
              key={session.id}
              title={session.subject}
              subtitle={t('studyPlanner.sessionSubtitle', {
                minutes: session.durationMin,
                type: session.topic ?? session.type,
              })}
              completed={session.completed}
              onToggle={() => handleToggleTask(session.id, session.completed)}
            />
          ))
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          label={t('examPlan.openPlanner')}
          variant="ghost"
          onPress={() => navigation.navigate('StudyPlanner', { date: today.date })}
        />
        <Button
          label={t('examPlan.openRoadmap')}
          variant="ghost"
          onPress={() => navigation.navigate('Roadmap')}
        />
      </View>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing['2xl'],
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyWrap: {
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    empty: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    heroRow: {
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    examDateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.full,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    examDateText: {
      ...theme.typography.presets.caption,
      color: '#FFFFFF',
    },
    aiCard: {
      gap: theme.spacing.sm,
    },
    dreamCard: {
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.brand.primaryMuted,
      borderColor: theme.colors.border.default,
    },
    dreamHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    dreamTitle: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    dreamMessage: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      lineHeight: 22,
    },
    dreamHint: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    weekProgressCard: {
      gap: theme.spacing.sm,
    },
    weekProgressTrack: {
      height: 8,
      borderRadius: 99,
      backgroundColor: theme.colors.border.subtle,
      overflow: 'hidden',
    },
    weekProgressFill: {
      height: '100%',
      borderRadius: 99,
      backgroundColor: theme.colors.brand.primary,
    },
    weekProgressMeta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    aiTitle: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    aiSummary: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
    },
    strategy: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    section: {
      gap: theme.spacing.sm,
    },
    detailCard: {
      gap: theme.spacing.sm,
    },
    journey: {
      paddingVertical: theme.spacing.sm,
    },
    phaseCard: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    phaseTitle: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    body: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    metaLine: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    subheading: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    bullet: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    stageList: {
      gap: theme.spacing.xs / 2,
    },
    physicalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    tasksCard: {
      gap: theme.spacing.xs,
    },
    emptyTasks: {
      gap: theme.spacing.md,
      alignItems: 'stretch',
    },
    actions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
  });
}

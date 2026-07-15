import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
  Sparkles,
  Trophy,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import type { PlannerSession } from '../../api/types';
import { displayExamName } from '../../utils/examTarget';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { GoalDots } from './GoalDots';
import { HOME_UI, homeFeedCard, homePressFeedback } from './homeTheme';
import type { HomeFeed } from '../../types/home';

const DAILY_GOAL_TOTAL = 3;
const PLAN_SEGMENTS = 4;

type HomeExamHubCardProps = {
  streak: HomeFeed['streak'];
  rank: HomeFeed['rank'];
  dailyChallenge: HomeFeed['dailyChallenge'];
  studyActive?: boolean;
  examName?: string | null;
  daysLeft?: number | null;
  sessions?: PlannerSession[];
  planSummary?: string;
  planCompleted: number;
  planTotal: number;
  planProgressPct: number;
  planLoading?: boolean;
  onExamPlanPress?: () => void;
  onRankCtaPress?: () => void;
};

function computeGoalProgress(
  streak: HomeFeed['streak'],
  dailyChallenge: HomeFeed['dailyChallenge'],
  studyActive: boolean,
) {
  let done = 0;
  if (streak.todayDone) done += 1;
  if (dailyChallenge?.status === 'done') done += 1;
  if (studyActive) done += 1;
  return { done: Math.min(done, DAILY_GOAL_TOTAL), total: DAILY_GOAL_TOTAL };
}

function findNextSession(sessions: PlannerSession[]): PlannerSession | null {
  return (
    [...sessions]
      .filter((session) => !session.completed)
      .sort((left, right) => left.startTime.localeCompare(right.startTime))[0] ?? null
  );
}

export function HomeExamHubCard({
  streak,
  rank,
  dailyChallenge,
  studyActive = false,
  examName,
  daysLeft,
  sessions = [],
  planCompleted,
  planTotal,
  planLoading = false,
  onExamPlanPress,
  onRankCtaPress,
}: HomeExamHubCardProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);
  const goal = computeGoalProgress(streak, dailyChallenge, studyActive);
  const airLabel = rank.air != null ? `#${rank.air}` : '—';
  const hasRank = rank.air != null;
  const hasPlan = planTotal > 0;
  const allDone = hasPlan && planCompleted >= planTotal;
  const nextSession = findNextSession(sessions);
  const resolvedExam = displayExamName(examName);
  const segmentTotal = Math.max(planTotal || PLAN_SEGMENTS, 1);
  const filledSegs = hasPlan
    ? Math.min(planCompleted, segmentTotal)
    : Math.min(goal.done, PLAN_SEGMENTS);

  const planTitle = allDone
    ? t('home.planComplete')
    : hasPlan
      ? t('home.planTasksProgress', { done: planCompleted, total: planTotal })
      : planLoading
        ? t('home.planGenerating')
        : t('home.planEmpty');

  return (
    <View style={styles.card} testID="home-section-streak">
      <View style={styles.examRow}>
        <View style={styles.examIcon}>
          <BookOpen size={19} color={HOME_UI.goldDeep} strokeWidth={1.8} />
        </View>
        <View style={styles.examCopy}>
          <Text style={styles.examEyebrow}>{t('home.targetExam')}</Text>
          <Text style={styles.examName} numberOfLines={1} ellipsizeMode="tail">
            {resolvedExam ?? t('home.setExamChip')}
          </Text>
        </View>
        {daysLeft != null && resolvedExam ? (
          <View style={styles.daysChip}>
            <NumText style={styles.daysNum}>{daysLeft}</NumText>
            <Text style={styles.daysLabel}>{t('home.daysLeftLabel')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.aiPlanCardA11y', {
          completed: planCompleted,
          total: planTotal || goal.total,
        })}
        onPress={onExamPlanPress}
        disabled={!onExamPlanPress}
        style={({ pressed }) => [styles.planRow, pressed && onExamPlanPress && styles.pressed]}
        testID="home-section-ai-plan"
      >
        <LinearGradient
          colors={[...HOME_UI.accentGradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.planIcon}
        >
          <Sparkles size={18} color={HOME_UI.goldLt} strokeWidth={2} fill={HOME_UI.goldLt} />
        </LinearGradient>
        <View style={styles.planCopy}>
          <Text style={styles.planEyebrow}>{t('home.todayPlan')}</Text>
          <Text style={styles.planTitle} numberOfLines={2} ellipsizeMode="tail">
            {planTitle}
          </Text>
        </View>
        <View style={styles.chevron}>
          <ChevronRight size={13} color={HOME_UI.ink} strokeWidth={2.2} />
        </View>
      </Pressable>

      <View style={styles.segRow}>
        {Array.from({ length: Math.min(segmentTotal, 6) }).map((_, index) => (
          <View
            key={index}
            style={[styles.seg, index < filledSegs ? styles.segFilled : styles.segEmpty]}
          />
        ))}
      </View>

      {nextSession ? (
        <View style={styles.nextBox}>
          <Clock size={16} color={HOME_UI.goldDeep} strokeWidth={1.8} />
          <View style={styles.nextCopy}>
            <Text style={styles.nextEyebrow} numberOfLines={1}>
              {t('home.nextUp')} · {nextSession.startTime}
            </Text>
            <Text style={styles.nextTitle} numberOfLines={1} ellipsizeMode="tail">
              {nextSession.subject}
              {nextSession.topic ? ` — ${nextSession.topic}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <View style={styles.statValueRow}>
            <Flame size={13} color="#E3A13C" strokeWidth={2} fill="#E3A13C" />
            <NumText style={styles.statValue}>{streak.current}</NumText>
          </View>
          <Text style={styles.statLabel}>{t('home.dayStreak')}</Text>
        </View>
        <View style={styles.statRule} />
        <View style={styles.stat}>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>
              {goal.done}/{goal.total}
            </Text>
            <GoalDots done={goal.done} total={goal.total} />
          </View>
          <Text style={styles.statLabel}>{t('home.todaysGoal')}</Text>
        </View>
        <View style={styles.statRule} />
        <View style={styles.stat}>
          <View style={styles.statValueRow}>
            <Trophy size={13} color={HOME_UI.gold} strokeWidth={1.8} />
            <NumText style={styles.statValue}>{airLabel}</NumText>
          </View>
          <Text style={styles.statLabel}>{t('home.airRankLabel')}</Text>
        </View>
      </View>

      {!hasRank && onRankCtaPress ? (
        <View style={styles.footer}>
          <Text style={styles.rankHint} numberOfLines={1}>
            {t('home.noRankYet')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRankCtaPress}
            style={({ pressed }) => [styles.rankCta, pressed && styles.pressed]}
          >
            <Text style={styles.rankCtaLabel} numberOfLines={1}>
              {t('home.takeTestToRank')}
            </Text>
            <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      ...homeFeedCard(),
      borderRadius: 26,
      padding: 18,
      ...{
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.12,
        shadowRadius: 44,
        elevation: 8,
      },
    },
    examRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    examIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F4EAD0',
      flexShrink: 0,
    },
    examCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    examEyebrow: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: HOME_UI.goldDeep,
      textTransform: 'uppercase',
    },
    examName: {
      fontSize: 16,
      fontWeight: '700',
      color: HOME_UI.ink,
    },
    daysChip: {
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: HOME_UI.goldSoft,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
      flexShrink: 0,
    },
    daysNum: {
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 22,
      color: HOME_UI.ink,
    },
    daysLabel: {
      marginTop: 3,
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: HOME_UI.goldDeep,
      textTransform: 'uppercase',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: HOME_UI.border,
      marginVertical: 14,
    },
    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    planIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    planCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    planEyebrow: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: HOME_UI.goldDeep,
      textTransform: 'uppercase',
    },
    planTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: HOME_UI.ink,
      lineHeight: 22,
    },
    chevron: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F1E4',
      flexShrink: 0,
    },
    segRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 12,
    },
    seg: {
      flex: 1,
      height: 6,
      borderRadius: 99,
    },
    segFilled: {
      backgroundColor: HOME_UI.gold,
    },
    segEmpty: {
      backgroundColor: '#EFE8D6',
    },
    nextBox: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 14,
      backgroundColor: HOME_UI.tileBg,
    },
    nextCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    nextEyebrow: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: HOME_UI.goldDeep,
      textTransform: 'uppercase',
    },
    nextTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: HOME_UI.ink,
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: HOME_UI.border,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      minWidth: 0,
      paddingHorizontal: 4,
    },
    statRule: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: HOME_UI.border,
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '800',
      color: HOME_UI.ink,
    },
    statLabel: {
      fontSize: 10.5,
      fontWeight: '600',
      color: HOME_UI.muted,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: HOME_UI.border,
    },
    rankHint: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    rankCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: HOME_UI.accent,
      flexShrink: 1,
      maxWidth: '62%',
    },
    rankCtaLabel: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    pressed: homePressFeedback,
  });
}

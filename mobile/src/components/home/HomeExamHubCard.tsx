import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
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
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import { GoalDots } from './GoalDots';
import { HomePremiumButton } from './HomePremiumButton';
import { HOME_UI, homeFeedCard, homePressFeedback } from './homeTheme';
import type { HomeFeed } from '../../types/home';

const DAILY_GOAL_TOTAL = 3;

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
  planSummary,
  planCompleted,
  planTotal,
  planProgressPct,
  planLoading = false,
  onExamPlanPress,
  onRankCtaPress,
}: HomeExamHubCardProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);
  const goal = computeGoalProgress(streak, dailyChallenge, studyActive);
  const airLabel = rank.air != null ? `#${rank.air}` : '—';
  const hasRank = rank.air != null;
  const rankDelta = rank.deltaWeek > 0 ? rank.deltaWeek : null;
  const hasPlan = planTotal > 0;
  const allDone = hasPlan && planCompleted >= planTotal;
  const nextSession = findNextSession(sessions);
  const resolvedExam = displayExamName(examName);
  const progressPct = hasPlan ? planProgressPct : Math.round((goal.done / goal.total) * 100);

  return (
    <View style={styles.card} testID="home-section-streak">
      <LinearGradient
        colors={[HOME_UI.goldSoft, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.examStrip}
      >
        <View style={styles.examStripLeft}>
          <BookOpen size={13} color={HOME_UI.goldDeep} strokeWidth={2.2} />
          <Text style={styles.examStripName} numberOfLines={1}>
            {resolvedExam ?? t('home.setExamChip')}
          </Text>
        </View>
        {daysLeft != null && resolvedExam ? (
          <View style={styles.daysChip}>
            <NumText style={styles.daysChipNum}>{daysLeft}</NumText>
            <Text style={styles.daysChipLabel}>{t('home.daysUnit')}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.aiPlanCardA11y', {
          completed: planCompleted,
          total: planTotal || goal.total,
        })}
        onPress={onExamPlanPress}
        disabled={!onExamPlanPress}
        style={({ pressed }) => [styles.planBlock, pressed && onExamPlanPress && styles.pressed]}
        testID="home-section-ai-plan"
      >
        <View style={styles.planHeader}>
          <LinearGradient
            colors={[HOME_UI.goldLt, HOME_UI.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planIconWrap}
          >
            <Sparkles size={17} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>

          <View style={styles.planHeaderCopy}>
            <Text style={styles.planEyebrow}>{t('home.todayPlan')}</Text>
            <Text style={styles.planTitle}>
              {allDone
                ? t('home.planComplete')
                : hasPlan
                  ? t('home.planTasksProgress', { done: planCompleted, total: planTotal })
                  : planLoading
                    ? t('home.planGenerating')
                    : t('home.planEmpty')}
            </Text>
          </View>

          <ChevronRight size={18} color={HOME_UI.muted} strokeWidth={2} />
        </View>

        {nextSession ? (
          <View style={styles.nextTaskCard}>
            <View style={styles.nextTaskTop}>
              <Text style={styles.nextTaskLabel}>{t('home.nextUp')}</Text>
              <View style={styles.nextTaskTime}>
                <Clock size={11} color={HOME_UI.sageDeep} strokeWidth={2} />
                <Text style={styles.nextTaskTimeText}>{nextSession.startTime}</Text>
              </View>
            </View>
            <Text style={styles.nextTaskSubject} numberOfLines={1}>
              {nextSession.subject}
              {nextSession.topic ? ` · ${nextSession.topic}` : ''}
            </Text>
            <Text style={styles.nextTaskMeta} numberOfLines={1}>
              {t('home.nextTaskMeta', {
                minutes: nextSession.durationMin,
                type: nextSession.type,
              })}
            </Text>
          </View>
        ) : planSummary && !allDone ? (
          <Text style={styles.planSummary} numberOfLines={2}>
            {planSummary}
          </Text>
        ) : null}

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={
                allDone
                  ? [HOME_UI.sage, HOME_UI.sageDeep]
                  : [HOME_UI.goldLt, HOME_UI.gold]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${Math.max(progressPct, allDone ? 100 : 4)}%` }]}
            />
          </View>
          {hasPlan ? (
            <RankRing
              value={planProgressPct}
              max={100}
              displayValue={planProgressPct}
              size={52}
              strokeWidth={5}
              variant={allDone ? 'teal' : 'gold'}
              style={styles.planRing}
            />
          ) : (
            <Text style={styles.progressPct}>{progressPct}%</Text>
          )}
        </View>

        <Text style={styles.openPlanHint}>{t('home.openFullPlan')}</Text>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.statIconFlame]}>
            <Flame size={15} color={HOME_UI.goldDeep} strokeWidth={2.2} />
          </View>
          <NumText style={styles.statValue}>{streak.current}</NumText>
          <Text style={styles.statLabel}>{t('home.dayStreak')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.statIconGoal]}>
            <CheckCircle2 size={15} color={HOME_UI.sageDeep} strokeWidth={2.2} />
          </View>
          <Text style={styles.statValueSm}>
            {goal.done}/{goal.total}
          </Text>
          <GoalDots done={goal.done} total={goal.total} />
          <Text style={styles.statLabel}>{t('home.todaysGoal')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.statIconRank]}>
            <Trophy size={15} color={HOME_UI.accent} strokeWidth={2.2} />
          </View>
          <NumText style={styles.statValue}>{airLabel}</NumText>
          <Text style={styles.statLabel}>{t('home.airAbbrev')}</Text>
        </View>
      </View>

      {!hasRank && onRankCtaPress ? (
        <View style={styles.footer}>
          <Text style={styles.rankHint}>{t('home.noRankYet')}</Text>
          <HomePremiumButton
            label={t('home.takeTestToRank')}
            variant="outline"
            size="sm"
            trailingIcon={ArrowRight}
            onPress={onRankCtaPress}
          />
        </View>
      ) : hasRank ? (
        <View style={styles.footerRankOnly}>
          <Text style={styles.rankHint}>{t('home.allIndiaRankNumber', { rank: rank.air })}</Text>
          {rankDelta != null ? (
            <Text style={styles.rankDelta}>{t('home.rankUpWeek', { count: rankDelta })}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      ...homeFeedCard(),
      borderRadius: HOME_UI.cardRadiusLg,
      overflow: 'hidden',
    },
    examStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: HOME_UI.goldBorder,
    },
    examStripLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginRight: 10,
    },
    examStripName: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: HOME_UI.ink,
      letterSpacing: -0.1,
    },
    daysChip: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: 'rgba(35,42,77,0.08)',
    },
    daysChipNum: {
      fontSize: 13,
      fontWeight: '800',
      color: HOME_UI.accent,
    },
    daysChipLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: HOME_UI.muted,
      textTransform: 'uppercase',
    },
    planBlock: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 12,
      gap: 10,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    planIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    planEyebrow: {
      fontSize: 10,
      fontWeight: '700',
      color: HOME_UI.goldDeep,
      letterSpacing: 0.55,
      textTransform: 'uppercase',
    },
    planTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: HOME_UI.ink,
      letterSpacing: -0.3,
      lineHeight: 21,
    },
    nextTaskCard: {
      borderRadius: 14,
      backgroundColor: HOME_UI.tileBg,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    nextTaskTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nextTaskLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: HOME_UI.sageDeep,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    nextTaskTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    nextTaskTimeText: {
      fontSize: 11,
      fontWeight: '700',
      color: HOME_UI.sageDeep,
    },
    nextTaskSubject: {
      fontSize: 14,
      fontWeight: '700',
      color: HOME_UI.ink,
      letterSpacing: -0.1,
    },
    nextTaskMeta: {
      fontSize: 11,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    planSummary: {
      fontSize: 12,
      fontWeight: '600',
      color: HOME_UI.muted,
      lineHeight: 16,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    progressTrack: {
      flex: 1,
      height: 8,
      borderRadius: 99,
      backgroundColor: HOME_UI.borderSoft,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 99,
      minWidth: 8,
    },
    progressPct: {
      fontSize: 12,
      fontWeight: '800',
      color: HOME_UI.goldDeep,
      minWidth: 36,
      textAlign: 'right',
    },
    planRing: {
      flexShrink: 0,
    },
    openPlanHint: {
      fontSize: 11,
      fontWeight: '600',
      color: HOME_UI.muted,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 14,
      backgroundColor: HOME_UI.tileBg,
      borderWidth: 1,
      borderColor: HOME_UI.border,
    },
    statIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIconFlame: {
      backgroundColor: HOME_UI.goldSoft,
    },
    statIconGoal: {
      backgroundColor: HOME_UI.sageSoft,
    },
    statIconRank: {
      backgroundColor: HOME_UI.accentSoft,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: HOME_UI.ink,
      lineHeight: 18,
    },
    statValueSm: {
      fontSize: 14,
      fontWeight: '800',
      color: HOME_UI.ink,
      lineHeight: 16,
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: HOME_UI.muted,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: HOME_UI.border,
      paddingVertical: 11,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    footerRankOnly: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: HOME_UI.border,
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 2,
    },
    rankHint: {
      fontSize: 12,
      color: HOME_UI.muted,
      fontWeight: '600',
      flex: 1,
    },
    rankDelta: {
      fontSize: 11,
      fontWeight: '700',
      color: HOME_UI.sageDeep,
    },
    pressed: homePressFeedback,
  });
}

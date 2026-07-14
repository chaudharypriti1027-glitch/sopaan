import { User } from '../models/User.js';
import { PlannerSession } from '../models/PlannerSession.js';
import { AppError } from '../utils/AppError.js';
import { daysUntilIst, formatIstLongDateLabel, toIstDateKey } from '../utils/date.js';
import { endOfDay, startOfDay } from '../utils/pagination.js';
import { normalizeExamTrack } from '../utils/examTrack.js';
import { resolveExamTrackForUser } from '../utils/resolveExamTrackForUser.js';
import { buildRoadmap as buildAiRoadmap } from './ai/roadmap.js';
import { buildExamPlanAdvice } from './ai/examPlan.js';
import { syncUserGoal } from './goalSyncService.js';
import { getOrCreateProfile } from './profileService.js';
import { buildRoadmap as buildPhaseRoadmap, buildExamSearchQuery } from './roadmapService.js';
import { Exam } from '../models/Exam.js';
import { Goal } from '../models/Goal.js';
import { buildWeeklySchedule, loadWeekSessions } from './examPlan/weeklySchedule.js';

const PHYSICAL_STAGE_PATTERN = /physical|pet|pst|fitness|running|endurance/i;

function formatExam(exam) {
  if (!exam) {
    return null;
  }

  return {
    id: String(exam._id),
    name: exam.name,
    code: exam.code,
    category: exam.category,
    description: exam.description ?? null,
    eligibility: exam.eligibility ?? null,
    stages: exam.stages ?? [],
    importantDates: (exam.importantDates ?? []).map((item) => ({
      label: item.label,
      date: new Date(item.date).toISOString(),
      type: item.type,
    })),
    vacancies: exam.vacancies ?? null,
    cutoffs: exam.cutoffs ?? [],
    recommendedBooks: exam.recommendedBooks ?? [],
  };
}

function detectPhysicalPrep(exam) {
  const stages = exam?.stages ?? [];
  const hasPhysicalStage = stages.some((stage) => PHYSICAL_STAGE_PATTERN.test(stage.name));

  return {
    hasPhysicalStage,
    stageNames: stages
      .filter((stage) => PHYSICAL_STAGE_PATTERN.test(stage.name))
      .map((stage) => stage.name),
    tips: hasPhysicalStage
      ? [
          'Train endurance with timed running sessions 4–5 days per week.',
          'Practice event-specific drills (long jump, high jump, etc.) as per your exam PET/PST norms.',
          'Balance recovery with written prep — avoid overtraining before mock weeks.',
        ]
      : [],
  };
}

async function loadPlannerProgress(userId, now = new Date()) {
  const todayKey = toIstDateKey(now);
  const todayStart = startOfDay(todayKey);
  const todayEnd = endOfDay(todayKey);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const sessions = await PlannerSession.find({
    userId,
    date: { $gte: weekStart, $lte: todayEnd },
  })
    .sort({ date: 1, startTime: 1 })
    .lean();

  const todaySessions = sessions.filter(
    (session) => session.date >= todayStart && session.date <= todayEnd,
  );

  const completedToday = todaySessions.filter((session) => session.completed).length;
  const completedWeek = sessions.filter((session) => session.completed).length;

  return {
    today: {
      date: todayKey,
      sessions: todaySessions.map((session) => ({
        id: String(session._id),
        subject: session.subject,
        topic: session.topic,
        startTime: session.startTime,
        durationMin: session.durationMin,
        type: session.type,
        reason: session.reason,
        motivation: session.motivation,
        completed: session.completed,
        actionType: session.actionType ?? null,
        actionResourceId: session.actionResourceId ?? null,
      })),
      completed: completedToday,
      total: todaySessions.length,
      progressPct: todaySessions.length
        ? Math.round((completedToday / todaySessions.length) * 100)
        : 0,
    },
    week: {
      completed: completedWeek,
      total: sessions.length,
      progressPct: sessions.length
        ? Math.round((completedWeek / sessions.length) * 100)
        : 0,
    },
  };
}

function resolveExamTrack(user, profile, goal) {
  return resolveExamTrackForUser(user, profile, goal);
}

function resolveExamDate(user, exam) {
  if (user.examDate) {
    return new Date(user.examDate);
  }

  const now = new Date();
  const upcoming = (exam?.importantDates ?? [])
    .filter((item) => item.type === 'exam' && new Date(item.date) >= now)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  return upcoming[0] ? new Date(upcoming[0].date) : null;
}

export async function getExamPlan(userId) {
  await syncUserGoal(userId);

  const user = await User.findById(userId).lean();

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const activeGoal = user.activeGoalId
    ? await Goal.findById(user.activeGoalId).lean()
    : null;
  const profile = await getOrCreateProfile(userId);

  const examTrack = resolveExamTrack(user, profile, activeGoal);

  if (!examTrack) {
    throw new AppError('Set your target exam to view your AI exam plan', 400, 'GOAL_NOT_SET');
  }

  if (
    profile.goal?.examTrack !== examTrack ||
    !profile.goal?.targetYear
  ) {
    profile.goal = {
      examTrack,
      targetYear: profile.goal?.targetYear ?? profile.targetYear ?? new Date().getFullYear() + 1,
    };
    profile.completeness = profile.computeCompleteness();
    await profile.save();
  }

  if (!normalizeExamTrack(user.targetExam)) {
    await User.findByIdAndUpdate(userId, { targetExam: examTrack });
  }

  const exam = await Exam.findOne(buildExamSearchQuery(examTrack)).lean();
  const examDate = resolveExamDate(user, exam);
  const targetYear =
    profile.goal?.targetYear ?? profile.targetYear ?? examDate?.getFullYear() ?? new Date().getFullYear() + 1;

  const [roadmap, plannerProgress, weekSessions] = await Promise.all([
    buildAiRoadmap({
      examTrack,
      targetYear,
      profile,
    }),
    loadPlannerProgress(userId),
    loadWeekSessions(userId),
  ]);

  const phasePlan = buildPhaseRoadmap({ exam, profile });
  const physicalPrep = detectPhysicalPrep(exam);
  const daysLeft = examDate ? Math.max(0, daysUntilIst(examDate)) : null;
  const dailyGoalMinutes = profile.preferences?.dailyGoalMinutes ?? 90;

  const weeklySchedule = buildWeeklySchedule({
    examTrack,
    dailyGoalMinutes,
    daysLeft,
    currentPhaseName: roadmap.currentStage,
    physicalPrep,
    sessions: weekSessions,
  });

  const weekPlanProgress = weeklySchedule.reduce(
    (acc, day) => ({
      completed: acc.completed + day.completed,
      total: acc.total + day.total,
    }),
    { completed: 0, total: 0 },
  );
  weekPlanProgress.progressPct = weekPlanProgress.total
    ? Math.round((weekPlanProgress.completed / weekPlanProgress.total) * 100)
    : 0;

  const aiAdvice = await buildExamPlanAdvice({
    examTrack,
    targetYear,
    exam,
    roadmap: { ...roadmap, daysLeft },
    todayProgress: plannerProgress.today,
    weekProgress: plannerProgress.week,
    physicalPrep,
    language: profile.preferences?.language ?? user.language ?? 'en',
    userId,
  });

  return {
    goal: {
      examTrack,
      examName: exam?.name ?? examTrack,
      targetYear,
      examDate: examDate?.toISOString() ?? null,
      dateLabel: examDate ? formatIstLongDateLabel(examDate) : null,
      daysLeft,
    },
    exam: formatExam(exam),
    roadmap,
    phases: phasePlan.phases,
    weeklyPlan: phasePlan.weeklyPlan,
    upcomingDates: phasePlan.upcomingDates,
    physicalPrep,
    aiAdvice,
    today: plannerProgress.today,
    weekProgress: plannerProgress.week,
    weeklySchedule,
    weekPlanProgress,
    generatedAt: new Date().toISOString(),
  };
}

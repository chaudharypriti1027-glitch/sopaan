import { PlannerSession } from '../models/PlannerSession.js';
import { CurrentAffair } from '../models/CurrentAffair.js';
import { publishedContentFilter } from '../models/publishableFields.js';
import { endOfDay, startOfDay } from '../utils/pagination.js';
import { toIstDateKey } from '../utils/date.js';
import { getTodayDigest } from './currentAffairs/currentAffairDigestService.js';
import { getDailyChallengeGameId } from '../../../shared/dailyChallenge.js';

function formatPlannerTask(session) {
  return {
    id: String(session._id),
    kind: 'planner',
    title: session.subject,
    subtitle: session.topic ?? session.type,
    completed: Boolean(session.completed),
    durationMin: session.durationMin,
    startTime: session.startTime,
    actionType: session.actionType ?? null,
    actionResourceId: session.actionResourceId ?? null,
    deeplink: buildDeeplink(session.actionType, session.actionResourceId),
  };
}

function buildDeeplink(actionType, actionResourceId) {
  switch (actionType) {
    case 'ca_digest':
      return '/tabs/CurrentAffairs';
    case 'ca_article':
      return actionResourceId ? `/stack/CurrentAffairReader/${actionResourceId}` : '/tabs/CurrentAffairs';
    case 'ca_quiz':
      return actionResourceId
        ? `/stack/GamePlay/rapid-fire?affairId=${actionResourceId}`
        : '/stack/Games';
    case 'game':
      return `/stack/GamePlay/${actionResourceId || getDailyChallengeGameId()}`;
    case 'exam_plan':
      return '/stack/ExamPlan';
    default:
      return '/stack/StudyPlanner';
  }
}

function formatAffairTask(affair) {
  return {
    id: `ca-${affair.id}`,
    kind: 'current_affair',
    title: affair.title,
    subtitle: affair.shortAnswer || affair.summary?.slice(0, 90) || 'Read & revise',
    completed: false,
    affairId: affair.id,
    examTip: affair.examTip ?? null,
    shortAnswer: affair.shortAnswer ?? null,
    keyPoints: affair.keyPoints ?? [],
    quizQuestionCount: affair.quizQuestionCount ?? 0,
    deeplink: `/stack/CurrentAffairReader/${affair.id}`,
    quizDeeplink: affair.quizQuestionCount
      ? `/stack/GamePlay/rapid-fire?affairId=${affair.id}`
      : null,
  };
}

function normalizeAffairEntry(entry) {
  return {
    id: entry.id ?? String(entry._id),
    title: entry.title,
    summary: entry.summary,
    shortAnswer: entry.shortAnswer ?? null,
    examTip: entry.examTip ?? null,
    keyPoints: Array.isArray(entry.keyPoints) ? entry.keyPoints.filter(Boolean) : [],
    quizQuestionCount: Array.isArray(entry.quizQuestions)
      ? entry.quizQuestions.length
      : entry.quizQuestionCount ?? 0,
  };
}

export async function getDailyRoutine(userId, { date = new Date() } = {}) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dateKey = toIstDateKey(dayStart);

  const [sessions, digest, headlineAffairs] = await Promise.all([
    PlannerSession.find({
      userId,
      date: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ startTime: 1 })
      .lean(),
    getTodayDigest({}).catch(() => null),
    CurrentAffair.find(publishedContentFilter)
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title summary shortAnswer examTip keyPoints quizQuestions publishedAt')
      .lean(),
  ]);

  const affairTasks = (digest?.affairs?.length ? digest.affairs : headlineAffairs).map((entry) =>
    formatAffairTask(normalizeAffairEntry(entry)),
  );

  const plannerTasks = sessions.map(formatPlannerTask);
  const dailyGameId = getDailyChallengeGameId(date);
  const gameTask = {
    id: 'daily-game',
    kind: 'game',
    title: 'GK mini-game',
    subtitle: "Today's featured challenge — play to revise",
    completed: false,
    gameId: dailyGameId,
    deeplink: affairTasks[0]?.quizDeeplink ?? `/stack/GamePlay/${dailyGameId}`,
  };

  const tasks = [...plannerTasks, ...affairTasks.slice(0, 3), gameTask];
  const completed = tasks.filter((task) => task.completed).length;

  return {
    date: dateKey,
    headline:
      digest?.summary ??
      `Your daily routine: ${plannerTasks.length} study blocks, ${affairTasks.length} affairs, and a quick GK game.`,
    progress: {
      completed,
      total: tasks.length,
      progressPct: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    },
    digest: digest
      ? {
          id: digest.id,
          title: digest.title,
          summary: digest.summary,
          itemCount: digest.itemCount ?? digest.affairs?.length ?? 0,
        }
      : null,
    tasks,
    tips: affairTasks
      .map((task) => task.examTip)
      .filter(Boolean)
      .slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}

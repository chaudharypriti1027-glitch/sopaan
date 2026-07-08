import { Attempt } from '../../models/Attempt.js';
import { Question } from '../../models/Question.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { FocusLog } from '../../models/FocusLog.js';
import { PhysicalLog } from '../../models/PhysicalLog.js';
import { Exam } from '../../models/Exam.js';
import { AppError } from '../../utils/AppError.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { complete } from './claudeClient.js';
import { stubAttemptCoaching } from './e2eStubs.js';
import { COACHING_RUBRIC, READINESS_FOCUS_RUBRIC } from './prompts/stablePrompts.js';
import { buildExamSearchQuery } from '../roadmapService.js';
import { getStandards } from '../physicalService.js';
import { average } from '../../utils/testHelpers.js';

function isPhysicalExamTrack(examTrack = '') {
  const normalized = examTrack.toLowerCase();
  return (
    normalized.includes('police') ||
    normalized.includes('defence') ||
    normalized.includes('defense') ||
    normalized.includes('army') ||
    normalized.includes('navy') ||
    normalized.includes('afcat')
  );
}

function buildTopicStats(answers, questionMap) {
  const topics = new Map();

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId.toString());
    const topic = question?.topic ?? 'General';

    if (!topics.has(topic)) {
      topics.set(topic, { correct: 0, total: 0, timeSec: 0 });
    }

    const stats = topics.get(topic);
    stats.total += 1;
    stats.timeSec += answer.timeSec ?? 0;

    if (answer.correct) {
      stats.correct += 1;
    }
  }

  return [...topics.entries()].map(([topic, stats]) => ({
    topic,
    accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    avgTimeSec: stats.total ? Math.round(stats.timeSec / stats.total) : 0,
    questions: stats.total,
  }));
}

function validateCoachingResponse(data, fallbackWeakTopics) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid coaching response shape');
  }

  const feedback = typeof data.feedback === 'string' ? data.feedback.trim() : '';
  const weakTopics = Array.isArray(data.weakTopics)
    ? data.weakTopics.filter((item) => typeof item === 'string' && item.trim())
    : fallbackWeakTopics;
  const actions = Array.isArray(data.actions)
    ? data.actions.filter((item) => typeof item === 'string' && item.trim()).slice(0, 2)
    : [];

  if (!feedback || actions.length < 2) {
    throw new Error('Coaching response missing feedback or actions');
  }

  return { feedback, weakTopics, actions };
}

function fallbackAttemptCoaching({ attempt, test, topicStats, weakTopics }) {
  const slowTopics = topicStats
    .filter((item) => item.accuracy < 70)
    .map((item) => item.topic);

  const topics = weakTopics.length ? weakTopics : slowTopics;

  return {
    feedback: `You scored ${attempt.accuracy}% on "${test.title}". ${
      topics.length
        ? `Focus on ${topics.slice(0, 3).join(', ')} where accuracy or pacing needs work.`
        : 'Solid attempt — keep building consistency.'
    }`,
    weakTopics: topics,
    actions: [
      'Review every incorrect question and note the concept gap.',
      `Attempt a timed sectional test on ${topics[0] ?? test.subject}.`,
    ],
  };
}

export function instantAttemptCoaching({ attempt, test, questions }) {
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
  const topicStats = buildTopicStats(attempt.answers, questionMap);
  return fallbackAttemptCoaching({
    attempt,
    test,
    topicStats,
    weakTopics: attempt.weakTopics ?? [],
  });
}

export async function feedbackForAttempt({ attempt, test, questions, userId }) {
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
  const topicStats = buildTopicStats(attempt.answers, questionMap);

  if (aiRuntimeConfig.stubResponses) {
    return stubAttemptCoaching({ attempt, test, topicStats, weakTopics: attempt.weakTopics ?? [] });
  }

  const payload = {
    testTitle: test.title,
    subject: test.subject,
    examTag: test.examTag,
    score: attempt.score,
    totalQuestions: attempt.answers.length,
    accuracy: attempt.accuracy,
    totalTimeSec: attempt.totalTimeSec,
    topicStats,
  };

  try {
    const raw = await complete({
      stableSystem: COACHING_RUBRIC,
      user: JSON.stringify(payload),
      tier: 'quality',
      feature: 'attempt_coaching',
      userId,
      maxTokens: 1024,
      json: true,
    });

    return validateCoachingResponse(raw, attempt.weakTopics ?? []);
  } catch (err) {
    console.warn(`[coach] AI coaching unavailable, using fallback: ${err.message}`);

    return fallbackAttemptCoaching({
      attempt,
      test,
      topicStats,
      weakTopics: attempt.weakTopics ?? [],
    });
  }
}

async function buildSubjectMastery(userId, attempts) {
  const questionIds = [
    ...new Set(
      attempts.flatMap((attempt) => attempt.answers.map((answer) => answer.questionId.toString()))
    ),
  ];

  const questions = await Question.find({ _id: { $in: questionIds } })
    .select('subject topic')
    .lean();
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

  const subjects = new Map();

  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const question = questionMap.get(answer.questionId.toString());
      const name = question?.subject ?? 'General';

      if (!subjects.has(name)) {
        subjects.set(name, { correct: 0, total: 0 });
      }

      const entry = subjects.get(name);
      entry.total += 1;

      if (answer.correct) {
        entry.correct += 1;
      }
    }
  }

  return [...subjects.entries()].map(([name, stats]) => ({
    name,
    pct: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));
}

function computePhysicalAreaPct(examTrack, physicalLogs) {
  const standards = getStandards(examTrack);

  if (!standards.length || !physicalLogs.length) {
    return 0;
  }

  const latestByType = new Map();

  for (const log of physicalLogs) {
    if (!latestByType.has(log.testType)) {
      latestByType.set(log.testType, log);
    }
  }

  const scores = standards.map((standard) => {
    const log = latestByType.get(standard.testType);

    if (!log) {
      return 0;
    }

    if (standard.targetMax != null) {
      return Math.min(100, Math.round((standard.targetMax / log.value) * 100));
    }

    if (standard.targetMin != null) {
      return Math.min(100, Math.round((log.value / standard.targetMin) * 100));
    }

    return 50;
  });

  return Math.round(average(scores));
}

function computeStudyConsistencyPct(focusLogs) {
  return Math.min(100, Math.round(average(focusLogs.map((log) => log.focusMinutes ?? 0)) * 2));
}

async function computeCutoffGap(examTrack, category, currentMarksProxy) {
  const exam = await Exam.findOne(buildExamSearchQuery(examTrack)).lean();

  if (!exam?.cutoffs?.length) {
    return {
      target: null,
      current: Math.round(currentMarksProxy),
      gap: null,
      note: 'No cutoff data available for this exam track yet.',
    };
  }

  const cutoff =
    exam.cutoffs.find((item) => item.category === category) ??
    exam.cutoffs.find((item) => item.category === 'GEN') ??
    exam.cutoffs[0];

  const target = cutoff.marks;
  const current = Math.round(currentMarksProxy);
  const gap = Math.max(0, target - current);

  return { target, current, gap, category: cutoff.category, year: cutoff.year };
}

function computeOverallScore(byArea) {
  if (!byArea.length) {
    return 0;
  }

  return Math.round(average(byArea.map((area) => area.pct)));
}

async function generateFocusNext({ examTrack, byArea, cutoffGap, userId }) {
  const weakest = [...byArea].sort((a, b) => a.pct - b.pct).slice(0, 3);

  try {
    const raw = await complete({
      stableSystem: READINESS_FOCUS_RUBRIC,
      user: JSON.stringify({ examTrack, weakestAreas: weakest, cutoffGap }),
      tier: 'fast',
      feature: 'readiness_focus',
      userId,
      maxTokens: 512,
      json: true,
    });

    if (Array.isArray(raw)) {
      return raw.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5);
    }

    if (Array.isArray(raw?.focusNext)) {
      return raw.focusNext.filter((item) => typeof item === 'string').slice(0, 5);
    }
  } catch {
    // fall through to rule-based guidance
  }

  const focus = [];

  if (weakest[0]) {
    focus.push(`Strengthen ${weakest[0].name} (currently ${weakest[0].pct}%).`);
  }

  if (cutoffGap.gap != null && cutoffGap.gap > 0) {
    focus.push(`Close the ${cutoffGap.gap}-mark gap to the ${cutoffGap.category} cutoff.`);
  }

  focus.push('Take one timed sectional mock and review all incorrect questions.');

  return focus.slice(0, 5);
}

export async function readinessForGoal(userId) {
  const profile = await StudentProfile.findOne({ userId });

  if (!profile?.goal?.examTrack) {
    throw new AppError('Set a goal before checking readiness', 400, 'GOAL_NOT_SET');
  }

  const examTrack = profile.goal.examTrack;
  const targetYear = profile.goal.targetYear ?? profile.targetYear;

  const [attempts, focusLogs, physicalLogs] = await Promise.all([
    Attempt.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    FocusLog.find({ userId }).sort({ date: -1 }).limit(14).lean(),
    PhysicalLog.find({ userId }).sort({ date: -1 }).limit(14).lean(),
  ]);

  const subjectAreas = await buildSubjectMastery(userId, attempts);
  const studyConsistency = computeStudyConsistencyPct(focusLogs);
  const profilePct = profile.completeness ?? 0;

  const byArea = [
    ...subjectAreas,
    { name: 'Profile Completeness', pct: profilePct },
    { name: 'Study Consistency', pct: studyConsistency },
  ];

  if (isPhysicalExamTrack(examTrack)) {
    byArea.push({
      name: 'Physical Fitness',
      pct: computePhysicalAreaPct(examTrack, physicalLogs),
    });
  }

  const currentMarksProxy = average(attempts.map((attempt) => attempt.accuracy ?? 0));
  const cutoffGap = await computeCutoffGap(examTrack, profile.category ?? 'GEN', currentMarksProxy);
  const score = computeOverallScore(byArea);
  const focusNext = await generateFocusNext({ examTrack, byArea, cutoffGap, userId });

  return {
    score,
    examTrack,
    targetYear,
    byArea,
    cutoffGap,
    focusNext,
    assessedAt: new Date().toISOString(),
  };
}

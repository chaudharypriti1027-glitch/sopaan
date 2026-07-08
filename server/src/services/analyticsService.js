import { Attempt } from '../models/Attempt.js';
import { FocusLog } from '../models/FocusLog.js';
import { Test } from '../models/Test.js';
import { weekKeyToRange } from '../jobs/runKeys.js';
import { average, subtractDays } from '../utils/testHelpers.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';

function getRangeStart(range, weekKey) {
  const weekRange = weekKey ? weekKeyToRange(weekKey) : null;
  if (weekRange) {
    return weekRange.start;
  }

  const now = new Date();

  if (range === 'week') {
    return subtractDays(now, 7);
  }

  if (range === 'month') {
    return subtractDays(now, 30);
  }

  return null;
}

function getRangeEnd(weekKey) {
  const weekRange = weekKey ? weekKeyToRange(weekKey) : null;
  return weekRange?.end ?? null;
}

function groupAccuracyByDate(attempts) {
  const buckets = new Map();

  for (const attempt of attempts) {
    const key = new Date(attempt.createdAt).toISOString().slice(0, 10);

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    buckets.get(key).push(attempt.accuracy ?? 0);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      accuracy: Math.round(average(values)),
      attempts: values.length,
    }));
}

function buildSubjectMastery(attempts, testsById) {
  const subjects = new Map();

  for (const attempt of attempts) {
    const test = testsById.get(attempt.testId.toString());
    const subject = test?.subject ?? 'General';

    if (!subjects.has(subject)) {
      subjects.set(subject, []);
    }

    subjects.get(subject).push(attempt.accuracy ?? 0);
  }

  return [...subjects.entries()].map(([subject, accuracies]) => ({
    subject,
    mastery: Math.round(average(accuracies)),
    attempts: accuracies.length,
  }));
}

function withDeltas(currentPeriod, previousPeriod) {
  const previousMap = new Map(previousPeriod.map((item) => [item.subject, item.mastery]));

  return currentPeriod.map((item) => ({
    ...item,
    delta: item.mastery - (previousMap.get(item.subject) ?? item.mastery),
  }));
}

export async function getProgressAnalytics(userId, range, weekKey) {
  const cacheKey = stableCacheKey('cache:analytics', {
    userId: String(userId),
    range: range ?? 'all',
    weekKey: weekKey ?? '',
  });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.analyticsProgressSec, () =>
    buildProgressAnalytics(userId, range, weekKey),
  );
}

async function buildProgressAnalytics(userId, range, weekKey) {
  const rangeStart = getRangeStart(range, weekKey);
  const rangeEnd = getRangeEnd(weekKey);
  const attemptFilter = { userId };

  if (rangeStart || rangeEnd) {
    attemptFilter.createdAt = {};
    if (rangeStart) {
      attemptFilter.createdAt.$gte = rangeStart;
    }
    if (rangeEnd) {
      attemptFilter.createdAt.$lt = rangeEnd;
    }
  }

  const focusFilter = { userId };
  if (rangeStart || rangeEnd) {
    focusFilter.date = {};
    if (rangeStart) {
      focusFilter.date.$gte = rangeStart;
    }
    if (rangeEnd) {
      focusFilter.date.$lt = rangeEnd;
    }
  }

  const [attempts, focusLogs] = await Promise.all([
    Attempt.find(attemptFilter).select('accuracy createdAt testId').sort({ createdAt: 1 }).limit(1000).lean(),
    FocusLog.find(focusFilter).select('date focusMinutes sessionsCompleted').sort({ date: 1 }).limit(365).lean(),
  ]);

  const testIds = [...new Set(attempts.map((attempt) => attempt.testId.toString()))];
  const tests = await Test.find({ _id: { $in: testIds } }).select('subject').lean();
  const testsById = new Map(tests.map((test) => [test._id.toString(), test]));

  const studyHoursTrend = focusLogs.map((log) => ({
    date: log.date,
    focusMinutes: log.focusMinutes,
    focusHours: Math.round((log.focusMinutes / 60) * 10) / 10,
    sessionsCompleted: log.sessionsCompleted,
  }));

  const accuracyTrend = groupAccuracyByDate(attempts);
  const subjectMastery = buildSubjectMastery(attempts, testsById);

  let subjectMasteryWithDeltas = subjectMastery;

  if (range === 'week' || range === 'month') {
    const midpoint = rangeStart ? new Date((Date.now() + rangeStart.getTime()) / 2) : null;

    if (midpoint) {
      const recentAttempts = attempts.filter((attempt) => new Date(attempt.createdAt) >= midpoint);
      const previousAttempts = attempts.filter((attempt) => new Date(attempt.createdAt) < midpoint);
      const recentMastery = buildSubjectMastery(recentAttempts, testsById);
      const previousMastery = buildSubjectMastery(previousAttempts, testsById);
      subjectMasteryWithDeltas = withDeltas(recentMastery, previousMastery);
    }
  }

  return {
    range,
    weekKey: weekKey ?? undefined,
    summary: {
      totalAttempts: attempts.length,
      avgAccuracy: Math.round(average(attempts.map((attempt) => attempt.accuracy ?? 0))),
      totalStudyHours: Math.round(
        (focusLogs.reduce((sum, log) => sum + (log.focusMinutes ?? 0), 0) / 60) * 10
      ) / 10,
    },
    studyHoursTrend,
    accuracyTrend,
    subjectMastery: subjectMasteryWithDeltas,
  };
}

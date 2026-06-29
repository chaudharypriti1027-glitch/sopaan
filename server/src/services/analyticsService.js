import { Attempt } from '../models/Attempt.js';
import { FocusLog } from '../models/FocusLog.js';
import { Test } from '../models/Test.js';
import { average, subtractDays } from '../utils/testHelpers.js';

function getRangeStart(range) {
  const now = new Date();

  if (range === 'week') {
    return subtractDays(now, 7);
  }

  if (range === 'month') {
    return subtractDays(now, 30);
  }

  return null;
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

export async function getProgressAnalytics(userId, range) {
  const rangeStart = getRangeStart(range);
  const attemptFilter = { userId };

  if (rangeStart) {
    attemptFilter.createdAt = { $gte: rangeStart };
  }

  const [attempts, focusLogs] = await Promise.all([
    Attempt.find(attemptFilter).sort({ createdAt: 1 }).limit(1000).lean(),
    FocusLog.find(
      rangeStart ? { userId, date: { $gte: rangeStart } } : { userId }
    )
      .sort({ date: 1 })
      .limit(365)
      .lean(),
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

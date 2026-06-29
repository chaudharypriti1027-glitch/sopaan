import { Attempt } from '../models/Attempt.js';
import { FocusLog } from '../models/FocusLog.js';
import { PhysicalLog } from '../models/PhysicalLog.js';
import { AppError } from '../utils/AppError.js';

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

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildRecommendations(factors, examTrack) {
  const recommendations = [];

  if (factors.profileCompleteness < 80) {
    recommendations.push('Complete your profile to improve personalized recommendations.');
  }

  if (factors.testPerformance < 60) {
    recommendations.push('Take more sectional mocks to strengthen weak areas.');
  }

  if (factors.studyConsistency < 50) {
    recommendations.push('Increase daily focus time to build exam readiness.');
  }

  if (isPhysicalExamTrack(examTrack) && factors.physicalReadiness < 60) {
    recommendations.push('Log physical training sessions to track Police/Defence fitness goals.');
  }

  if (!recommendations.length) {
    recommendations.push('Stay consistent with mocks and revision capsules.');
  }

  return recommendations;
}

export async function getReadinessScore(userId, profile) {
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

  const profileCompleteness = profile.completeness ?? 0;
  const testPerformance = average(attempts.map((attempt) => attempt.accuracy ?? 0));
  const studyConsistency = Math.min(
    100,
    average(focusLogs.map((log) => log.focusMinutes ?? 0)) * 2
  );
  const physicalReadiness = isPhysicalExamTrack(examTrack)
    ? Math.min(100, physicalLogs.length * 15)
    : null;

  const weights = isPhysicalExamTrack(examTrack)
    ? { profileCompleteness: 0.2, testPerformance: 0.35, studyConsistency: 0.2, physicalReadiness: 0.25 }
    : { profileCompleteness: 0.25, testPerformance: 0.45, studyConsistency: 0.3, physicalReadiness: 0 };

  let score =
    profileCompleteness * weights.profileCompleteness +
    testPerformance * weights.testPerformance +
    studyConsistency * weights.studyConsistency;

  if (physicalReadiness != null) {
    score += physicalReadiness * weights.physicalReadiness;
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  const factors = {
    profileCompleteness: Math.round(profileCompleteness),
    testPerformance: Math.round(testPerformance),
    studyConsistency: Math.round(studyConsistency),
    ...(physicalReadiness != null ? { physicalReadiness: Math.round(physicalReadiness) } : {}),
  };

  return {
    score,
    examTrack,
    targetYear,
    factors,
    recommendations: buildRecommendations(factors, examTrack),
    assessedAt: new Date().toISOString(),
  };
}

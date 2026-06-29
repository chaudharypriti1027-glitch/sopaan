import { Attempt } from '../models/Attempt.js';
import { User } from '../models/User.js';

export async function buildLiveMockLeaderboard(testId, { limit = 25 } = {}) {
  const attempts = await Attempt.find({ testId })
    .sort({ score: -1, totalTimeSec: 1, createdAt: 1 })
    .limit(limit)
    .select('userId score accuracy totalTimeSec rank createdAt')
    .lean();

  const userIds = [...new Set(attempts.map((item) => item.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
  const namesById = new Map(users.map((user) => [user._id.toString(), user.name]));

  return attempts.map((attempt, index) => ({
    rank: index + 1,
    userId: attempt.userId.toString(),
    name: namesById.get(attempt.userId.toString()) ?? 'Student',
    score: attempt.score,
    accuracy: attempt.accuracy,
    totalTimeSec: attempt.totalTimeSec,
    submittedAt: attempt.createdAt,
  }));
}

export function formatLeaderboardPayload(testId, entries) {
  return {
    testId: testId.toString(),
    entries,
    updatedAt: new Date().toISOString(),
  };
}

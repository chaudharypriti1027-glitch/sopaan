import { Attempt } from '../../models/Attempt.js';
import { Goal } from '../../models/Goal.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { Test } from '../../models/Test.js';
import { safeHomeCall } from './safe.js';

const TEST_SELECT =
  'title difficulty durationSec questions type examTag topic subject stats questionCount durationMinutes';

function mapTestCard(test) {
  const qCount = test.questionCount ?? test.questions?.length ?? 0;
  const durationMin = test.durationSec
    ? Math.round(test.durationSec / 60)
    : test.durationMinutes ?? Math.max(10, qCount);

  return {
    id: test._id?.toString() ?? test.id,
    title: test.title,
    qCount,
    durationMin,
    difficulty: test.difficulty ?? 'medium',
    tag: test.type ?? test.examTag ?? undefined,
  };
}

async function collectWeakTopics(userId) {
  const attempts = await Attempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('weakTopics')
    .lean();

  const counts = new Map();

  for (const attempt of attempts) {
    for (const topic of attempt.weakTopics ?? []) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([topic]) => topic)
    .slice(0, 5);
}

async function resolveExamTag(user) {
  if (user?.activeGoalId) {
    const goal = await Goal.findById(user.activeGoalId).select('examName').lean();
    if (goal?.examName) {
      return goal.examName.split(' ')[0];
    }
  }

  const profile = await StudentProfile.findOne({ userId: user._id }).select('goal.examTrack').lean();
  const examTrack = profile?.goal?.examTrack;
  return examTrack ? examTrack.split(' ')[0] : null;
}

async function findTestsForWeakTopics(weakTopics, limit) {
  if (weakTopics.length === 0) {
    return [];
  }

  const topicMatchers = weakTopics.map((topic) => ({
    $or: [
      { topic: new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { subject: new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ],
  }));

  const tests = await Test.find({
    status: 'published',
    $or: topicMatchers,
  })
    .select(TEST_SELECT)
    .sort({ 'stats.attempts': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return tests;
}

async function findPopularExamTests(examTag, limit) {
  const filters = { status: 'published' };

  if (examTag) {
    filters.examTag = new RegExp(examTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const tests = await Test.find(filters)
    .select(TEST_SELECT)
    .sort({ 'stats.attempts': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return tests;
}

export async function getRecommendedTests(user, limit = 6) {
  return safeHomeCall('getRecommendedTests', async () => {
    if (!user?._id) {
      return [];
    }

    const weakTopics = await collectWeakTopics(user._id);
    let tests = await findTestsForWeakTopics(weakTopics, limit);

    if (tests.length < limit) {
      const examTag = await resolveExamTag(user);
      const popular = await findPopularExamTests(examTag, limit);

      const seen = new Set(tests.map((test) => test._id.toString()));
      for (const test of popular) {
        const id = test._id.toString();
        if (!seen.has(id)) {
          tests.push(test);
          seen.add(id);
        }
        if (tests.length >= limit) {
          break;
        }
      }
    }

    return tests.slice(0, limit).map(mapTestCard);
  }, []);
}

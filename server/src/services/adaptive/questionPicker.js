import { Attempt } from '../../models/Attempt.js';
import { Question } from '../../models/Question.js';
import { getSubjectMasteryRating } from './masteryService.js';
import { questionRatingWindow, targetQuestionRating } from './rating.js';

const RECENT_ATTEMPT_LIMIT = 25;

/**
 * Question IDs the user has answered recently (optionally filtered by subject).
 */
export async function getRecentlySeenQuestionIds(userId, subject) {
  const attempts = await Attempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(RECENT_ATTEMPT_LIMIT)
    .select('answers.questionId')
    .lean();

  const ids = [
    ...new Set(
      attempts.flatMap((attempt) => attempt.answers.map((answer) => answer.questionId.toString()))
    ),
  ];

  if (!subject || !ids.length) {
    return ids;
  }

  const inSubject = await Question.find({
    _id: { $in: ids },
    subject,
  })
    .select('_id')
    .lean();

  return inSubject.map((question) => question._id.toString());
}

function sortByTargetProximity(questions, targetRating) {
  return [...questions].sort(
    (left, right) =>
      Math.abs((left.rating ?? targetRating) - targetRating) -
      Math.abs((right.rating ?? targetRating) - targetRating)
  );
}

function pickWithTopicSpread(sortedQuestions, count) {
  const picked = [];
  const usedTopics = new Set();

  for (const question of sortedQuestions) {
    if (picked.length >= count) {
      break;
    }

    if (usedTopics.has(question.topic) && picked.length < count - 1) {
      continue;
    }

    picked.push(question);
    usedTopics.add(question.topic);
  }

  if (picked.length < count) {
    for (const question of sortedQuestions) {
      if (picked.length >= count) {
        break;
      }
      if (!picked.some((item) => item._id.toString() === question._id.toString())) {
        picked.push(question);
      }
    }
  }

  return picked.slice(0, count);
}

/**
 * Select questions near the user's mastery (slightly above), avoiding recent repeats.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} subject
 * @param {number} count
 * @param {{ topic?: string, examTag?: string }} [options]
 */
export async function getNextQuestions(userId, subject, count, options = {}) {
  const { topic, examTag } = options;
  const masteryRating = await getSubjectMasteryRating(userId, subject);
  const targetRating = targetQuestionRating(masteryRating);
  const { min, max } = questionRatingWindow(masteryRating);
  const excludeIds = await getRecentlySeenQuestionIds(userId, subject);

  const filter = {
    subject,
    rating: { $gte: min, $lte: max },
    _id: { $nin: excludeIds },
  };

  if (topic) {
    filter.topic = topic;
  }

  if (examTag) {
    filter.examTags = examTag;
  }

  let candidates = await Question.find(filter).limit(Math.max(count * 4, 20)).lean();

  if (candidates.length < count) {
    const relaxedFilter = {
      subject,
      _id: { $nin: excludeIds },
    };

    if (topic) {
      relaxedFilter.topic = topic;
    }

    if (examTag) {
      relaxedFilter.examTags = examTag;
    }

    candidates = await Question.find(relaxedFilter).limit(Math.max(count * 4, 20)).lean();
  }

  const sorted = sortByTargetProximity(candidates, targetRating);
  return pickWithTopicSpread(sorted, count);
}

export async function getAdaptiveTargetDifficulty(userId, subject) {
  const masteryRating = await getSubjectMasteryRating(userId, subject);
  const targetRating = targetQuestionRating(masteryRating);

  return {
    masteryRating,
    targetRating,
    window: questionRatingWindow(masteryRating),
  };
}

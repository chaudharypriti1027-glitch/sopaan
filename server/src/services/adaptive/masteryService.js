import { TopicMastery } from '../../models/TopicMastery.js';
import { Question } from '../../models/Question.js';
import {
  DEFAULT_MASTERY_RATING,
  applyOutcome,
  ratingFromDifficulty,
} from './rating.js';

export async function getTopicMastery(userId, subject, topic) {
  return TopicMastery.findOne({ userId, subject, topic });
}

export async function getOrCreateTopicMastery(userId, subject, topic) {
  // Atomic upsert avoids a find-then-create race: concurrent calls for the same
  // (userId, subject, topic) — e.g. grading several questions from the same topic
  // in one attempt — would otherwise both find nothing and both try to `create()`,
  // tripping the unique index and crashing the whole request with a duplicate-key error.
  return TopicMastery.findOneAndUpdate(
    { userId, subject, topic },
    {
      $setOnInsert: {
        userId,
        subject,
        topic,
        rating: DEFAULT_MASTERY_RATING,
        attempts: 0,
      },
    },
    { upsert: true, new: true },
  );
}

/**
 * Average topic mastery rating for a subject (falls back to default).
 */
export async function getSubjectMasteryRating(userId, subject) {
  const masteries = await TopicMastery.find({ userId, subject }).select('rating').lean();

  if (!masteries.length) {
    return DEFAULT_MASTERY_RATING;
  }

  const total = masteries.reduce((sum, item) => sum + item.rating, 0);
  return Math.round(total / masteries.length);
}

/**
 * Update user topic mastery and question rating after one answered question.
 */
export async function recordAnswerOutcome(userId, question, correct) {
  const questionRating = question.rating ?? ratingFromDifficulty(question.difficulty);
  const mastery = await getOrCreateTopicMastery(userId, question.subject, question.topic);

  const { userRating, questionRating: nextQuestionRating } = applyOutcome({
    userRating: mastery.rating,
    questionRating,
    correct,
  });

  mastery.rating = userRating;
  mastery.attempts += 1;
  mastery.lastSeen = new Date();
  await mastery.save();

  if (question.rating !== nextQuestionRating) {
    await Question.updateOne({ _id: question._id }, { $set: { rating: nextQuestionRating } });
    question.rating = nextQuestionRating;
  }

  return { mastery, questionRating: nextQuestionRating };
}

/**
 * Batch update from a graded attempt (one call per answer).
 *
 * Answers are grouped by topic and applied sequentially within each group:
 * the Elo-style rating update is order-dependent and read-modify-write, so
 * firing concurrent updates for the same (userId, subject, topic) would both
 * race on the same mastery document (lost updates) and re-trigger the
 * create-race that `getOrCreateTopicMastery` already guards against.
 * Different topics still update in parallel.
 */
export async function recordAttemptOutcomes(userId, questions, gradedAnswers) {
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
  const groups = new Map();

  for (const answer of gradedAnswers) {
    const question = questionMap.get(answer.questionId.toString());
    if (!question) {
      continue;
    }

    const key = `${question.subject}::${question.topic}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ question, correct: answer.correct });
  }

  const groupResults = await Promise.all(
    Array.from(groups.values()).map(async (entries) => {
      const results = [];
      for (const { question, correct } of entries) {
        results.push(await recordAnswerOutcome(userId, question, correct));
      }
      return results;
    }),
  );

  return groupResults.flat();
}

export async function listTopicMasteries(userId, subject) {
  return TopicMastery.find({ userId, subject }).sort({ rating: 1 }).lean();
}

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
  let mastery = await getTopicMastery(userId, subject, topic);

  if (!mastery) {
    mastery = await TopicMastery.create({
      userId,
      subject,
      topic,
      rating: DEFAULT_MASTERY_RATING,
      attempts: 0,
    });
  }

  return mastery;
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
 */
export async function recordAttemptOutcomes(userId, questions, gradedAnswers) {
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
  const updates = [];

  for (const answer of gradedAnswers) {
    const question = questionMap.get(answer.questionId.toString());
    if (!question) {
      continue;
    }

    updates.push(recordAnswerOutcome(userId, question, answer.correct));
  }

  return Promise.all(updates);
}

export async function listTopicMasteries(userId, subject) {
  return TopicMastery.find({ userId, subject }).sort({ rating: 1 }).lean();
}

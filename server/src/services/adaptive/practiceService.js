import { Test } from '../../models/Test.js';
import { generateQuestionBatch, SECONDS_PER_QUESTION } from '../ai/testGenerator.js';
import { getNextQuestions, getAdaptiveTargetDifficulty } from './questionPicker.js';
import { ratingToDifficultyLabel } from './rating.js';

function resolveTestStatus() {
  return 'published';
}

/**
 * Build a practice/test session from the question bank first, then AI for any gap.
 */
export async function createAdaptivePracticeTest({
  userId,
  userRole: _userRole,
  subject,
  topic,
  count,
  examTag,
  language,
}) {
  const bankQuestions = await getNextQuestions(userId, subject, count, { topic, examTag });
  const { targetRating } = await getAdaptiveTargetDifficulty(userId, subject);
  const difficultyLabel = ratingToDifficultyLabel(targetRating);

  let questionDocs = bankQuestions;

  const shortfall = count - bankQuestions.length;
  if (shortfall > 0) {
    const generated = await generateQuestionBatch({
      subject,
      topic: topic ?? bankQuestions[0]?.topic ?? 'Mixed',
      difficulty: difficultyLabel,
      count: shortfall,
      examTag,
      language,
      userId,
    });
    questionDocs = [...bankQuestions, ...generated];
  }

  const resolvedTopic = topic ?? 'Adaptive Mix';
  const test = await Test.create({
    title: `${subject} — ${resolvedTopic} (adaptive)`,
    subject,
    topic: resolvedTopic,
    difficulty: difficultyLabel,
    durationSec: questionDocs.length * SECONDS_PER_QUESTION,
    questions: questionDocs.map((question) => question._id),
    type: 'sectional',
    examTag,
    createdBy: userId,
    status: resolveTestStatus(),
  });

  const populated = await test.populate('questions');

  return {
    test: populated,
    adaptive: {
      masteryTargetRating: targetRating,
      difficulty: difficultyLabel,
      fromBank: bankQuestions.length,
      generated: shortfall > 0 ? shortfall : 0,
    },
  };
}

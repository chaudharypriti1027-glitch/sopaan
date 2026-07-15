import { Attempt } from '../../models/Attempt.js';
import { Question } from '../../models/Question.js';
import { Test } from '../../models/Test.js';
import { feedbackForAttempt } from '../../services/ai/coach.js';

export async function runAttemptCoachingHandler({ data } = {}) {
  const attemptId = data?.attemptId;
  if (!attemptId) {
    throw new Error('attempt-coaching job requires attemptId');
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    return { skipped: true, reason: 'attempt_not_found' };
  }

  const test = await Test.findById(attempt.testId);
  if (!test) {
    return { skipped: true, reason: 'test_not_found' };
  }

  const questions = await Question.find({ _id: { $in: test.questions } });
  const coaching = await feedbackForAttempt({
    attempt,
    test,
    questions,
    userId: attempt.userId,
  });

  await Attempt.findByIdAndUpdate(attemptId, {
    aiFeedback: coaching.feedback,
    weakTopics: coaching.weakTopics,
  });

  return { attemptId, updated: true };
}

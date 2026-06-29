import { Attempt } from '../models/Attempt.js';
import { Test } from '../models/Test.js';
import { Question } from '../models/Question.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import {
  average,
  computeRankAndPercentile,
} from '../utils/testHelpers.js';
import { feedbackForAttempt } from './ai/coach.js';
import { recordAttemptOutcomes } from './adaptive/masteryService.js';
import { handleAttemptRewards } from './gamificationService.js';
import { createNotification, PUSH_TYPES } from './notificationService.js';
import { recordFeatureUsage } from './quotaService.js';

async function getTestForSubmit(testId, userId) {
  const test = await Test.findOne({ _id: testId });

  if (!test) {
    throw new AppError('Test not found', 404, 'NOT_FOUND');
  }

  if (test.status !== 'published') {
    const isOwner = test.createdBy?.toString() === userId.toString();

    if (!isOwner) {
      throw new AppError('Test not found or not published', 404, 'NOT_FOUND');
    }
  }

  return test;
}

function gradeAnswers(testQuestionIds, questions, submittedAnswers) {
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
  const submittedMap = new Map(
    submittedAnswers.map((answer) => [answer.questionId, answer])
  );

  const gradedAnswers = [];
  const weakTopicSet = new Set();

  for (const questionId of testQuestionIds) {
    const question = questionMap.get(questionId.toString());
    const submitted = submittedMap.get(questionId.toString());
    const selectedKey = submitted?.selectedKey?.toUpperCase() ?? null;
    const correct = Boolean(selectedKey && selectedKey === question?.correctKey);

    if (!correct && question?.topic) {
      weakTopicSet.add(question.topic);
    }

    gradedAnswers.push({
      questionId: question._id,
      selectedKey,
      correct,
      timeSec: submitted?.timeSec ?? 0,
    });
  }

  const correctCount = gradedAnswers.filter((answer) => answer.correct).length;
  const totalQuestions = gradedAnswers.length;
  const totalTimeSec = gradedAnswers.reduce((sum, answer) => sum + (answer.timeSec ?? 0), 0);

  return {
    gradedAnswers,
    score: correctCount,
    accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    totalTimeSec,
    weakTopics: [...weakTopicSet],
  };
}

async function updateTestStats(test) {
  const attempts = await Attempt.find({ testId: test._id }).select('score').lean();
  test.stats.attempts = attempts.length;
  test.stats.avgScore = Math.round(average(attempts.map((item) => item.score)) * 10) / 10;
  await test.save();
}

export async function submitTest(userId, testId, submittedAnswers) {
  const test = await getTestForSubmit(testId, userId);
  const questions = await Question.find({ _id: { $in: test.questions } });

  if (questions.length !== test.questions.length) {
    throw new AppError('Test has invalid question references', 500, 'INTERNAL_ERROR');
  }

  const submittedIds = new Set(submittedAnswers.map((answer) => answer.questionId));
  const expectedIds = new Set(test.questions.map((id) => id.toString()));

  for (const id of expectedIds) {
    if (!submittedIds.has(id)) {
      throw new AppError('Answers must be provided for all test questions', 400, 'VALIDATION_ERROR');
    }
  }

  for (const id of submittedIds) {
    if (!expectedIds.has(id)) {
      throw new AppError('Invalid questionId in answers', 400, 'VALIDATION_ERROR');
    }
  }

  const { gradedAnswers, score, accuracy, totalTimeSec, weakTopics } = gradeAnswers(
    test.questions,
    questions,
    submittedAnswers
  );

  await recordAttemptOutcomes(userId, questions, gradedAnswers);

  const attempt = await Attempt.create({
    userId,
    testId,
    answers: gradedAnswers,
    score,
    accuracy,
    totalTimeSec,
    weakTopics,
  });

  const allScores = (
    await Attempt.find({ testId }).select('score').lean()
  ).map((item) => item.score);

  const { rank, percentile } = computeRankAndPercentile(allScores, score);
  attempt.rank = rank;
  attempt.percentile = percentile;

  const coaching = await feedbackForAttempt({ attempt, test, questions, userId });
  attempt.aiFeedback = coaching.feedback;
  attempt.weakTopics = coaching.weakTopics;
  await attempt.save();

  await recordFeatureUsage(userId, 'mock_submit');

  await updateTestStats(test);

  const { broadcastLiveMockLeaderboard } = await import('../realtime/index.js');
  broadcastLiveMockLeaderboard(testId).catch((err) => {
    console.warn(`[realtime] leaderboard broadcast failed for ${testId}:`, err.message);
  });

  const rewards = await handleAttemptRewards(userId, attempt);

  const attemptCount = await Attempt.countDocuments({ userId });
  if (attemptCount === 1) {
    const { tryGrantReferralRewards } = await import('./referralService.js');
    tryGrantReferralRewards(userId).catch((err) => {
      console.warn(`[referral] reward grant failed for ${userId}:`, err.message);
    });

    const { trackFirstTest } = await import('./experimentService.js');
    trackFirstTest(userId).catch((err) => {
      console.warn(`[experiments] first_test track failed for ${userId}:`, err.message);
    });
  }

  const previousBest = await Attempt.findOne({
    userId,
    testId,
    _id: { $ne: attempt._id },
  })
    .sort({ rank: 1 })
    .select('rank')
    .lean();

  if (
    attempt.rank &&
    (!previousBest?.rank || attempt.rank < previousBest.rank)
  ) {
    await createNotification(userId, {
      type: PUSH_TYPES.RANK_UP,
      title: 'Rank up!',
      body: `You reached rank #${attempt.rank} on ${test.title}.`,
      data: {
        rank: attempt.rank,
        testId: test._id.toString(),
        attemptId: attempt._id.toString(),
        previousRank: previousBest?.rank ?? null,
      },
    });
  }

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  return {
    attempt: {
      id: attempt._id,
      testId: attempt.testId,
      score: attempt.score,
      accuracy: attempt.accuracy,
      totalTimeSec: attempt.totalTimeSec,
      percentile: attempt.percentile,
      rank: attempt.rank,
      weakTopics: attempt.weakTopics,
      aiFeedback: attempt.aiFeedback,
      createdAt: attempt.createdAt,
    },
    coaching: {
      feedback: coaching.feedback,
      weakTopics: coaching.weakTopics,
      actions: coaching.actions,
    },
    rewards,
    answers: gradedAnswers.map((answer) => {
      const question = questionMap.get(answer.questionId.toString());
      return {
        ...answer,
        question: question
          ? {
              text: question.text,
              topic: question.topic,
              subject: question.subject,
              correctKey: question.correctKey,
              explanation: question.explanation,
              options: question.options,
            }
          : null,
      };
    }),
  };
}

export async function listAttempts(userId, query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    Attempt.find({ userId })
      .populate('testId', 'title subject type examTag difficulty durationSec')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Attempt.countDocuments({ userId }),
  ]);

  return buildPaginatedResult({
    items: items.map((item) => ({
      id: item._id,
      test: item.testId,
      score: item.score,
      accuracy: item.accuracy,
      totalTimeSec: item.totalTimeSec,
      percentile: item.percentile,
      rank: item.rank,
      weakTopics: item.weakTopics,
      createdAt: item.createdAt,
    })),
    total,
    limit,
    offset,
  });
}

function buildTimePerSection(answers, questionMap) {
  const sections = new Map();

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId.toString());
    const section = question?.subject ?? 'General';

    if (!sections.has(section)) {
      sections.set(section, { subject: section, totalTimeSec: 0, correct: 0, total: 0 });
    }

    const entry = sections.get(section);
    entry.totalTimeSec += answer.timeSec ?? 0;
    entry.total += 1;
    if (answer.correct) {
      entry.correct += 1;
    }
  }

  return [...sections.values()].map((section) => ({
    ...section,
    accuracy: section.total ? Math.round((section.correct / section.total) * 100) : 0,
  }));
}

export async function getAttemptAnalysis(userId, attemptId) {
  const attempt = await Attempt.findById(attemptId).populate('testId').lean();

  if (!attempt) {
    throw new AppError('Attempt not found', 404, 'NOT_FOUND');
  }

  if (attempt.userId.toString() !== userId.toString()) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const questions = await Question.find({
    _id: { $in: attempt.answers.map((answer) => answer.questionId) },
  }).lean();
  const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

  const testAttempts = await Attempt.find({ testId: attempt.testId._id })
    .select('score accuracy totalTimeSec')
    .lean();

  const topper = testAttempts.reduce(
    (best, current) => (current.score > best.score ? current : best),
    testAttempts[0] ?? { score: 0, accuracy: 0, totalTimeSec: 0 }
  );

  const comparison = {
    you: {
      score: attempt.score,
      accuracy: attempt.accuracy,
      totalTimeSec: attempt.totalTimeSec,
    },
    topper: {
      score: topper.score ?? 0,
      accuracy: topper.accuracy ?? 0,
      totalTimeSec: topper.totalTimeSec ?? 0,
    },
    average: {
      score: Math.round(average(testAttempts.map((item) => item.score)) * 10) / 10,
      accuracy: Math.round(average(testAttempts.map((item) => item.accuracy)) * 10) / 10,
      totalTimeSec: Math.round(average(testAttempts.map((item) => item.totalTimeSec))),
    },
  };

  const perQuestion = attempt.answers.map((answer) => {
    const question = questionMap.get(answer.questionId.toString());
    return {
      questionId: answer.questionId,
      selectedKey: answer.selectedKey,
      correct: answer.correct,
      timeSec: answer.timeSec,
      question: question
        ? {
            text: question.text,
            subject: question.subject,
            topic: question.topic,
            difficulty: question.difficulty,
            correctKey: question.correctKey,
            explanation: question.explanation,
            options: question.options,
          }
        : null,
    };
  });

  return {
    id: attempt._id,
    test: attempt.testId,
    score: attempt.score,
    accuracy: attempt.accuracy,
    totalTimeSec: attempt.totalTimeSec,
    percentile: attempt.percentile,
    rank: attempt.rank,
    weakTopics: attempt.weakTopics,
    aiFeedback: attempt.aiFeedback,
    createdAt: attempt.createdAt,
    perQuestion,
    timePerSection: buildTimePerSection(attempt.answers, questionMap),
    comparison,
  };
}

import { generateTest } from '../services/ai/testGenerator.js';
import { solveDoubt } from '../services/ai/doubtSolver.js';
import { evaluateAnswer } from '../services/ai/answerEvaluator.js';
import { suggestPracticeOptions } from '../services/ai/practiceSuggestions.js';
import { persistAnswerEvaluation, reportAiOutput } from '../services/ai/aiFeedbackService.js';
import { listDoubtAnswers } from '../services/ai/aiDoubtHistoryService.js';
import { recordFeatureUsage } from '../services/quotaService.js';
import { getValidatedQuery } from '../middleware/validate.js';

export async function generateTestHandler(req, res) {
  const test = await generateTest({
    ...req.body,
    language: req.body.language ?? req.language,
    userId: req.user._id,
    userRole: req.user.role,
  });

  await recordFeatureUsage(req.user._id, 'ai_generate_test');

  const testId = test._id?.toString?.() ?? test.id;

  res.status(201).json({
    id: testId,
    title: test.title,
    subject: test.subject,
    topic: test.topic,
    difficulty: test.difficulty,
    durationSec: test.durationSec,
    type: test.type,
    examTag: test.examTag,
    status: test.status,
    questionCount: test.questions?.length ?? test.questionCount,
  });
}

export async function practiceSuggestionsHandler(req, res) {
  const result = await suggestPracticeOptions({
    userId: req.user._id,
    user: req.user,
    examTag: req.body.examTag,
    subject: req.body.subject,
    topic: req.body.topic,
    language: req.body.language ?? req.language,
  });

  res.status(200).json(result);
}

export async function askDoubtHandler(req, res) {
  const result = await solveDoubt({
    ...req.body,
    language: req.body.language ?? req.language,
    userId: req.user._id,
    targetExam: req.user.targetExam,
  });
  res.status(200).json(result);
}

export async function listDoubtHistoryHandler(req, res) {
  const result = await listDoubtAnswers(req.user._id, getValidatedQuery(req));
  res.status(200).json(result);
}

export async function evaluateAnswerHandler(req, res) {
  const result = await evaluateAnswer({
    ...req.body,
    language: req.body.language ?? req.language,
    userId: req.user._id,
  });

  await recordFeatureUsage(req.user._id, 'ai_evaluate');

  const evaluation = await persistAnswerEvaluation(req.user._id, req.body, result);

  res.status(200).json({
    ...result,
    evaluationId: evaluation._id.toString(),
    maxMarks: req.body.maxMarks ?? 10,
  });
}

export async function reportAiFeedbackHandler(req, res) {
  const feedback = await reportAiOutput(req.user._id, req.body);

  res.status(201).json({
    id: feedback._id.toString(),
    status: feedback.status,
    message: 'Thanks — this answer has been flagged for review.',
  });
}

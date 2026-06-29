import { createAdaptivePracticeTest, getNextQuestions, getAdaptiveTargetDifficulty } from '../services/adaptive/index.js';

export async function createAdaptivePracticeHandler(req, res) {
  const result = await createAdaptivePracticeTest({
    ...req.body,
    userId: req.user._id,
    userRole: req.user.role,
  });

  res.status(201).json(result);
}

export async function previewAdaptiveQuestionsHandler(req, res) {
  const { subject, count, topic, examTag } = req.query;
  const [questions, target] = await Promise.all([
    getNextQuestions(req.user._id, subject, Number(count), { topic, examTag }),
    getAdaptiveTargetDifficulty(req.user._id, subject),
  ]);

  res.status(200).json({
    questions,
    adaptive: target,
  });
}

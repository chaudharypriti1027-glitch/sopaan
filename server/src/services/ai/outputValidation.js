import { z } from 'zod';
import { validateGeneratedQuestions } from '../../validators/aiValidators.js';

const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'];

const stringListSchema = z
  .array(z.string().min(1))
  .max(8)
  .nullish()
  .transform((value) => value ?? []);

const evaluationShapeSchema = z.object({
  score: z.number(),
  subScores: z.object({
    content: z.number(),
    structure: z.number(),
    clarity: z.number(),
  }),
  feedback: z.array(z.string().min(1)).min(1),
  strengths: stringListSchema,
  nextSteps: stringListSchema,
});

function clampScore(value, maxMarks) {
  return Math.min(maxMarks, Math.max(0, Math.round(value)));
}

function cleanStringList(items) {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function validateAnswerEvaluation(data, maxMarks) {
  const parsed = evaluationShapeSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((issue) => issue.message).join(', '));
  }

  const { score, subScores, feedback, strengths, nextSteps } = parsed.data;
  const numericFields = [score, subScores.content, subScores.structure, subScores.clarity];

  if (numericFields.some((value) => !Number.isFinite(value))) {
    throw new Error('Evaluation scores must be finite numbers');
  }

  if (numericFields.some((value) => value < 0 || value > maxMarks)) {
    throw new Error(`All scores must be between 0 and ${maxMarks}`);
  }

  const cleanedStrengths = cleanStringList(strengths);
  const cleanedFeedback = cleanStringList(feedback);
  const cleanedNextSteps = cleanStringList(nextSteps);

  if (!cleanedFeedback.length) {
    throw new Error('Feedback must include at least one item');
  }

  return {
    score: clampScore(score, maxMarks),
    subScores: {
      content: clampScore(subScores.content, maxMarks),
      structure: clampScore(subScores.structure, maxMarks),
      clarity: clampScore(subScores.clarity, maxMarks),
    },
    strengths: cleanedStrengths,
    feedback: cleanedFeedback,
    nextSteps: cleanedNextSteps,
  };
}

export function validateQuestionBatch(rawResponse, expectedCount) {
  const validatedQuestions = validateGeneratedQuestions(rawResponse);

  if (validatedQuestions.length !== expectedCount) {
    throw new Error(
      `AI returned ${validatedQuestions.length} questions but ${expectedCount} were requested`,
    );
  }

  for (const question of validatedQuestions) {
    const keys = question.options.map((option) => option.key);

    if (keys.length !== 4 || !VALID_OPTION_KEYS.every((key) => keys.includes(key))) {
      throw new Error('Each question must have exactly 4 options with keys A, B, C, and D');
    }

    if (!keys.includes(question.correctKey)) {
      throw new Error('correctKey must match one of the option keys');
    }
  }

  return validatedQuestions;
}

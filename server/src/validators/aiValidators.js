import { z } from 'zod';
import { paginationQuerySchema } from './contentValidators.js';

const optionSchema = z.object({
  key: z.string().trim().toUpperCase(),
  text: z.string().trim().min(1),
});

const generatedQuestionSchema = z.object({
  text: z.string().trim().min(1),
  options: z.array(optionSchema).length(4),
  correctKey: z.string().trim().toUpperCase(),
  explanation: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const generatedQuestionsSchema = z.array(generatedQuestionSchema).min(1);

export const generateTestRequestSchema = z
  .object({
    subject: z.string().trim().min(1, 'subject is required'),
    topic: z.string().trim().min(1, 'topic is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    adaptive: z.boolean().default(false),
    count: z.coerce.number().int().min(1).max(20).default(5),
    examTag: z.string().trim().min(1, 'examTag is required'),
    language: z.enum(['en', 'hi']).default('en'),
  })
  .superRefine((data, ctx) => {
    if (!data.adaptive && !data.difficulty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'difficulty is required when adaptive is false',
        path: ['difficulty'],
      });
    }
  });

export const askDoubtSchema = z.object({
  question: z.string().trim().min(1, 'question is required'),
  imageBase64: z.string().trim().optional(),
  language: z.enum(['en', 'hi']).default('en'),
  skipCache: z.boolean().optional().default(false),
});

export const listDoubtHistoryQuerySchema = paginationQuerySchema;

export const evaluateAnswerSchema = z
  .object({
    question: z.string().trim().min(1, 'question is required'),
    answerText: z.string().trim().optional(),
    maxMarks: z.coerce.number().min(1).max(100).default(10),
    imageBase64: z.string().trim().optional(),
    language: z.enum(['en', 'hi']).default('en'),
  })
  .refine((data) => data.answerText || data.imageBase64, {
    message: 'Either answerText or imageBase64 is required',
  });

export const reportAiFeedbackSchema = z.object({
  feature: z.enum(['doubt_solver', 'answer_evaluation', 'test_generation', 'attempt_coaching']),
  reason: z.enum(['inaccurate', 'off_topic', 'unsafe', 'other']).optional().default('other'),
  userComment: z.string().trim().max(500).optional(),
  inputSummary: z.string().trim().max(2000).optional(),
  outputSnapshot: z.record(z.unknown()),
  evaluationId: z.string().trim().min(1).optional(),
  attemptId: z.string().trim().min(1).optional(),
  maxMarks: z.coerce.number().int().min(1).max(100).optional(),
});

const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'];

export function validateGeneratedQuestions(data) {
  const parsed = generatedQuestionsSchema.safeParse(data);

  if (!parsed.success) {
    const message = parsed.error.errors.map((issue) => issue.message).join(', ');
    throw new Error(`AI response validation failed: ${message}`);
  }

  const errors = [];

  parsed.data.forEach((question, index) => {
    const keys = question.options.map((option) => option.key);

    if (!VALID_OPTION_KEYS.every((key) => keys.includes(key))) {
      errors.push(`questions[${index}].options must use keys A, B, C, and D exactly once`);
    }

    if (new Set(keys).size !== 4) {
      errors.push(`questions[${index}].options must have unique keys`);
    }

    if (!keys.includes(question.correctKey)) {
      errors.push(`questions[${index}].correctKey must match one of the option keys`);
    }
  });

  if (errors.length) {
    throw new Error(`AI response validation failed: ${errors.join('; ')}`);
  }

  return parsed.data;
}

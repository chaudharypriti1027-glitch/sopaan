import { z } from 'zod';

export const adaptivePracticeSchema = z.object({
  subject: z.string().trim().min(1, 'subject is required'),
  topic: z.string().trim().min(1).optional(),
  count: z.coerce.number().int().min(1).max(20).default(10),
  examTag: z.string().trim().min(1, 'examTag is required'),
  language: z.enum(['en', 'hi']).default('en'),
});

export const adaptiveQuestionsSchema = z.object({
  subject: z.string().trim().min(1, 'subject is required'),
  count: z.coerce.number().int().min(1).max(20).default(5),
  topic: z.string().trim().min(1).optional(),
  examTag: z.string().trim().min(1).optional(),
});

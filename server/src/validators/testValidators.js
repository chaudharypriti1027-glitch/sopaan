import { z } from 'zod';

export const listTestsQuerySchema = z.object({
  type: z.enum(['mock', 'sectional', 'pyq', 'community', 'series']).optional(),
  subject: z.string().trim().min(1).optional(),
  examTag: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const submitTestSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1, 'questionId is required'),
        selectedKey: z.string().trim().optional(),
        timeSec: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'At least one answer is required'),
});

export const analyticsProgressQuerySchema = z.object({
  range: z.enum(['week', 'month', 'all']).default('week'),
  weekKey: z
    .string()
    .trim()
    .regex(/^\d{4}-W\d{2}$/, 'weekKey must be YYYY-Www')
    .optional(),
});

export const attemptsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

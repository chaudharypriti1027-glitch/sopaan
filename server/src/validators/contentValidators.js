import { z } from 'zod';

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  language: z.enum(['en', 'hi']).optional(),
});

export const booksQuerySchema = paginationQuerySchema.extend({
  subject: z.string().trim().min(1).optional(),
});

export const revisionCapsulesQuerySchema = paginationQuerySchema.extend({
  subject: z.string().trim().min(1).optional(),
  language: z.enum(['en', 'hi']).optional(),
});

export const currentAffairsQuerySchema = paginationQuerySchema.extend({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
  month: z
    .string()
    .regex(/^(all|\d{4}-\d{2})$/, 'month must be YYYY-MM or all')
    .optional(),
  state: z.string().trim().min(1).max(64).optional(),
  category: z.string().trim().min(1).optional(),
});

export const digestDateQuerySchema = paginationQuerySchema.extend({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
});

export const courseProgressSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
  completed: z.boolean().default(true),
});

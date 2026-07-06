import { z } from 'zod';
import { objectIdSchema } from '../validators/commonValidators.js';
import {
  BOOK_COVER_THEMES,
  BOOK_GEN_JOB_STATES,
  BOOK_SOURCES,
  BOOK_STATUSES,
  BOOK_SUBJECTS,
  MAX_BOOK_GEN_CHAPTERS,
} from '../constants/library.js';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase alphanumeric with hyphens');

export const bookSubjectSchema = z.enum(BOOK_SUBJECTS);
export const bookCoverThemeSchema = z.enum(BOOK_COVER_THEMES);
export const bookStatusSchema = z.enum(BOOK_STATUSES);
export const bookSourceSchema = z.enum(BOOK_SOURCES);
export const bookGenJobStateSchema = z.enum(BOOK_GEN_JOB_STATES);

export const bookCreateSchema = z.object({
  title: z.string().trim().min(1).max(240),
  slug: slugSchema,
  author: z.string().trim().min(1).max(160).optional(),
  subject: bookSubjectSchema,
  description: z.string().trim().max(8000).optional(),
  coverTheme: bookCoverThemeSchema.optional(),
  language: z.string().trim().min(2).max(8).default('en'),
  pages: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingsCount: z.number().int().min(0).optional(),
  isPro: z.boolean().optional(),
  status: bookStatusSchema.optional(),
  source: bookSourceSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(48)).max(32).optional(),
  createdBy: objectIdSchema.optional(),
});

export const bookUpdateSchema = bookCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const chapterCreateSchema = z.object({
  bookId: objectIdSchema,
  order: z.number().int().min(1),
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().max(2000).optional(),
});

export const chapterUpdateSchema = chapterCreateSchema
  .omit({ bookId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const pageCreateSchema = z.object({
  bookId: objectIdSchema,
  chapterId: objectIdSchema,
  order: z.number().int().min(1),
  html: z.string().min(1),
  plainText: z.string().min(1),
});

export const pageUpdateSchema = pageCreateSchema
  .omit({ bookId: true, chapterId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const readingProgressUpsertSchema = z.object({
  bookId: objectIdSchema,
  lastPage: z.number().int().min(0).optional(),
  lastLine: z.number().int().min(0).optional(),
  percent: z.number().min(0).max(100).optional(),
});

export const bookmarkCreateSchema = z.object({
  bookId: objectIdSchema,
  page: z.number().int().min(1),
  line: z.number().int().min(0).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const bookGenJobCreateSchema = z.object({
  bookId: objectIdSchema,
  requestedBy: objectIdSchema.optional(),
  spec: z.record(z.unknown()),
  state: bookGenJobStateSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const bookGenJobUpdateSchema = z
  .object({
    state: bookGenJobStateSchema.optional(),
    progress: z.number().min(0).max(100).optional(),
    error: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const libraryBooksQuerySchema = z.object({
  subject: bookSubjectSchema.optional(),
  type: z.enum(['books', 'notes']).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  pro: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  sort: z.enum(['popular', 'new', 'rating']).default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const libraryBookParamsSchema = z.object({
  id: objectIdSchema,
});

export const libraryChapterParamsSchema = z.object({
  id: objectIdSchema,
  chapterId: objectIdSchema,
});

export const libraryPageOrderParamsSchema = z.object({
  id: objectIdSchema,
  order: z.coerce.number().int().min(1),
});

export const libraryBookmarkParamsSchema = z.object({
  id: objectIdSchema,
  bookmarkId: objectIdSchema,
});

export const libraryProgressBodySchema = z.object({
  page: z.number().int().min(0),
  line: z.number().int().min(0).optional(),
  percent: z.number().min(0).max(100).optional(),
});

export const libraryBookmarkBodySchema = z.object({
  page: z.number().int().min(1),
  line: z.number().int().min(0).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const adminBookGenerateSchema = z.object({
  title: z.string().trim().min(1).max(240),
  subject: bookSubjectSchema,
  audience: z.string().trim().min(1).max(240),
  chapters: z
    .array(z.string().trim().min(1).max(240))
    .min(1)
    .max(MAX_BOOK_GEN_CHAPTERS),
  isPro: z.boolean().optional().default(false),
  coverTheme: bookCoverThemeSchema.optional().default('navy'),
  author: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(8000).optional(),
  language: z.string().trim().min(2).max(8).optional().default('en'),
});

export const adminBookGenJobParamsSchema = z.object({
  jobId: objectIdSchema,
});

export const adminBookPublishParamsSchema = z.object({
  id: objectIdSchema,
});

export const libraryBookExplainBodySchema = z.object({
  page: z.number().int().min(1),
  text: z.string().trim().min(1).max(1200),
});

export const libraryEventBodySchema = z.object({
  event: z.enum([
    'book_open',
    'page_read',
    'explain_used',
    'read_aloud_start',
    'download',
    'download_delete',
  ]),
  bookId: objectIdSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});


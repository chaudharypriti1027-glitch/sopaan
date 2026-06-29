import { z } from 'zod';

const examSectionSchema = z.object({
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.coerce.number().int().min(1).max(25),
});

export const reviewTestSchema = z.object({
  decision: z.enum(['approve', 'reject']),
});

export const generateExamSchema = z.object({
  title: z.string().trim().min(1),
  examTag: z.string().trim().min(1),
  language: z.enum(['en', 'hi']).default('en'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  publish: z.boolean().default(false),
  sections: z.array(examSectionSchema).min(1).max(8),
});

export const examCreateSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  category: z.enum([
    'SSC',
    'Banking',
    'Railways',
    'UPSC',
    'StatePSC',
    'Police',
    'Defence',
    'Teaching',
  ]),
  description: z.string().trim().optional(),
  eligibility: z
    .object({
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      education: z.string().optional(),
    })
    .optional(),
  stages: z.array(z.object({ name: z.string(), order: z.number().int().min(1) })).optional(),
  importantDates: z
    .array(
      z.object({
        label: z.string(),
        date: z.coerce.date(),
        type: z.enum(['apply', 'exam', 'result', 'admit']),
      })
    )
    .optional(),
  vacancies: z.number().optional(),
  cutoffs: z
    .array(
      z.object({
        year: z.number(),
        category: z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS']),
        marks: z.number(),
      })
    )
    .optional(),
  recommendedBooks: z
    .array(
      z.object({
        title: z.string(),
        author: z.string().optional(),
        subject: z.string().optional(),
        rating: z.number().optional(),
        link: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const courseCreateSchema = z.object({
  title: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  examTags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  lessons: z
    .array(
      z.object({
        title: z.string(),
        order: z.number().int().min(1),
        videoUrl: z.string().optional(),
        durationSec: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  thumbnailColor: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const currentAffairCreateSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  category: z.string().trim().optional(),
  source: z.string().trim().optional(),
  publishedAt: z.coerce.date(),
  imageColor: z.string().optional(),
  quizQuestions: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const mentorCreateSchema = z.object({
  userId: z.string().min(1),
  expertise: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  sessionsCount: z.number().min(0).optional(),
  bio: z.string().optional(),
  slots: z
    .array(z.object({ start: z.coerce.date(), isBooked: z.boolean().optional() }))
    .optional(),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const aiFeedbackQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'reviewed', 'dismissed']).optional(),
  feature: z
    .enum(['doubt_solver', 'answer_evaluation', 'test_generation', 'attempt_coaching'])
    .optional(),
});

export const aiFeedbackReviewSchema = z.object({
  status: z.enum(['reviewed', 'dismissed']),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const jobRunsQuerySchema = paginationQuerySchema.extend({
  jobName: z.string().trim().min(1).optional(),
  status: z.enum(['running', 'completed', 'failed']).optional(),
});

export const triggerJobSchema = z.object({
  force: z.boolean().optional(),
});

export { adminContentQuerySchema, publishStatusSchema, questionReviewSchema } from './questionImportValidators.js';

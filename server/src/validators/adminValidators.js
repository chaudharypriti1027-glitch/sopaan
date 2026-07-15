import { z } from 'zod';
import { objectIdParamsSchema } from './commonValidators.js';

const examSectionSchema = z.object({
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.coerce.number().int().min(1).max(25),
});

export const reviewTestSchema = z
  .object({
    action: z.enum(['approve', 'reject']).optional(),
    decision: z.enum(['approve', 'reject']).optional(),
  })
  .refine((data) => Boolean(data.action || data.decision), {
    message: 'action is required',
    path: ['action'],
  });

export const generateExamSchema = z
  .object({
    exam: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    examTag: z.string().trim().min(1).optional(),
    count: z.coerce.number().int().min(1).max(25).optional(),
    language: z.enum(['en', 'hi']).default('en'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    publish: z.boolean().default(false),
    sections: z.array(examSectionSchema).min(1).max(8).optional(),
  })
  .refine((data) => Boolean(data.exam || data.examTag), {
    message: 'exam is required',
    path: ['exam'],
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
    'Other',
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
        type: z.enum(['open', 'apply', 'exam', 'result', 'admit', 'other']),
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

export const examUpdateSchema = examCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
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
        videoUrl: z.string().trim().url().optional().or(z.literal('')),
        durationSec: z.number().optional(),
        notes: z.string().optional(),
        materialUrl: z.string().trim().url().optional().or(z.literal('')),
        materialName: z.string().trim().optional(),
      })
    )
    .optional(),
  thumbnailColor: z.string().optional(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']).optional(),
});

export const currentAffairCreateSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  body: z.string().trim().optional(),
  category: z.string().trim().optional(),
  source: z.string().trim().optional(),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')),
  publishedAt: z.coerce.date(),
  imageColor: z.string().optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  quizQuestions: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const currentAffairUpdateSchema = currentAffairCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const attemptsDaysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(14),
});

export const mentorCreateSchema = z
  .object({
    userId: z.string().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    expertise: z.array(z.string().trim().min(1)).optional(),
    subjects: z.array(z.string().trim().min(1)).optional(),
    bio: z.string().trim().optional(),
    rate: z.coerce.number().min(0).optional(),
    avatarUrl: z.string().trim().url().optional(),
    rating: z.number().min(0).max(5).optional(),
    sessionsCount: z.number().min(0).optional(),
    slots: z
      .array(z.object({ start: z.coerce.date(), isBooked: z.boolean().optional() }))
      .optional(),
  })
  .refine((data) => Boolean(data.name?.trim() || data.userId), {
    message: 'name is required',
    path: ['name'],
  });

export const mentorUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  expertise: z.array(z.string().trim().min(1)).optional(),
  subjects: z.array(z.string().trim().min(1)).optional(),
  bio: z.string().trim().optional(),
  rate: z.coerce.number().min(0).optional(),
  avatarUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
  rating: z.number().min(0).max(5).optional(),
  sessionsCount: z.number().min(0).optional(),
  slots: z
    .array(z.object({ start: z.coerce.date(), isBooked: z.boolean().optional() }))
    .optional(),
  isActive: z.boolean().optional(),
});

export const mentorStatusSchema = z.object({
  isActive: z.boolean(),
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

export const aiFeedbackReviewSchema = z
  .object({
    action: z.enum(['keep', 'override']),
    grade: z.coerce.number().min(0).max(100).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.action !== 'override' || data.grade != null, {
    message: 'grade is required when action is override',
    path: ['grade'],
  });

export const jobRunsQuerySchema = paginationQuerySchema.extend({
  jobName: z.string().trim().min(1).optional(),
  status: z.enum(['running', 'completed', 'failed']).optional(),
});

export const triggerJobSchema = z.object({
  force: z.boolean().optional(),
});

export const adminStudentQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  /** pro = paid monthly/yearly; trial = welcome/trial Pro; free = not premium */
  premium: z.enum(['pro', 'free', 'trial']).optional(),
  exam: z.string().trim().min(1).max(80).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export const adminMentorQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
});

export const studentStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export const adminBroadcastSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  audience: z.enum(['all', 'active', 'pro', 'free']).optional().default('all'),
});

export const adminNotificationCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(500),
    audience: z.enum(['all', 'active30d', 'pro', 'free', 'byExam']),
    exam: z.string().trim().min(1).max(80).optional(),
    sendAt: z.coerce.date().optional(),
  })
  .refine((data) => data.audience !== 'byExam' || Boolean(data.exam), {
    message: 'exam is required when audience is byExam',
    path: ['exam'],
  });

export const adminNotificationAudienceQuerySchema = z.object({
  audience: z.enum(['all', 'active30d', 'pro', 'free', 'byExam']),
  exam: z.string().trim().min(1).max(80).optional(),
});

export const adminAnnouncementSchema = z.object({
  message: z.string().trim().min(1).max(280),
  link: z.string().trim().max(80).optional(),
  coverImageUrl: z.string().trim().url().optional(),
});

export const bannerLinkTypeSchema = z.enum([
  'premium',
  'test_series',
  'current_affairs',
  'live_classes',
  'readiness',
  'quiz',
  'deeplink',
]);

export const bannerCreateSchema = z
  .object({
    message: z.string().trim().min(1).max(280),
    linkType: bannerLinkTypeSchema,
    linkRef: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.linkType !== 'quiz' || Boolean(data.linkRef), {
    message: 'linkRef (test id) is required for quiz links',
    path: ['linkRef'],
  })
  .refine((data) => data.linkType !== 'deeplink' || Boolean(data.linkRef), {
    message: 'linkRef (deeplink path) is required for custom deeplinks',
    path: ['linkRef'],
  });

export const bannerUpdateSchema = z
  .object({
    message: z.string().trim().min(1).max(280).optional(),
    linkType: bannerLinkTypeSchema.optional(),
    linkRef: z.union([z.string().trim().max(200), z.literal(''), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const bannerActiveSchema = z.object({
  active: z.boolean(),
});

export const couponTypeSchema = z.enum(['percent', 'flat']);

export const couponCreateSchema = z
  .object({
    code: z.string().trim().min(2).max(32),
    type: couponTypeSchema,
    value: z.coerce.number().int().min(1),
    usageLimit: z.coerce.number().int().min(1).max(1_000_000),
    expiresAt: z.coerce.date(),
  })
  .refine((data) => data.type !== 'percent' || data.value <= 100, {
    message: 'Percent value must be between 1 and 100',
    path: ['value'],
  })
  .refine((data) => data.type !== 'flat' || data.value >= 100, {
    message: 'Flat discount must be at least ₹1 (100 paise)',
    path: ['value'],
  });

export const couponUpdateSchema = z
  .object({
    type: couponTypeSchema.optional(),
    value: z.coerce.number().int().min(1).optional(),
    usageLimit: z.coerce.number().int().min(1).max(1_000_000).optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .refine((data) => data.type !== 'percent' || data.value === undefined || data.value <= 100, {
    message: 'Percent value must be between 1 and 100',
    path: ['value'],
  })
  .refine((data) => data.type !== 'flat' || data.value === undefined || data.value >= 100, {
    message: 'Flat discount must be at least ₹1 (100 paise)',
    path: ['value'],
  });

export const couponActiveSchema = z.object({
  active: z.boolean(),
});

export const teamInviteSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  role: z.enum(['admin', 'creator', 'moderator']),
});

export const teamRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'creator', 'moderator']),
});

export const platformSettingsUpdateSchema = z
  .object({
    freeAiQuota: z.coerce.number().int().min(0).max(10_000).optional(),
    freeAiTestsPerDay: z.coerce.number().int().min(0).max(10_000).optional(),
    freeAiQualityDoubtsPerDay: z.coerce.number().int().min(0).max(10_000).optional(),
    freeAiEvaluationsPerDay: z.coerce.number().int().min(0).max(10_000).optional(),
    freeMocksPerDay: z.coerce.number().int().min(0).max(10_000).optional(),
    freeShowAds: z.boolean().optional(),
    freeDetailedAnalytics: z.boolean().optional(),
    proPriceMonthly: z.coerce.number().int().min(1).max(1_000_000).optional(),
    proPriceYearly: z.coerce.number().int().min(1).max(10_000_000).optional(),
    proAiTestsPerDay: z.coerce.number().int().min(0).max(100_000).optional(),
    proAiDoubtsPerDay: z.coerce.number().int().min(0).max(100_000).optional(),
    proAiQualityDoubtsPerDay: z.coerce.number().int().min(0).max(100_000).optional(),
    proAiEvaluationsPerDay: z.coerce.number().int().min(0).max(100_000).optional(),
    proMocksPerDay: z.coerce.number().int().min(0).max(100_000).optional(),
    welcomeMonthEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one setting is required',
  });

export const mediaPostSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('presign'),
    filename: z.string().trim().min(1).max(200),
    mimeType: z.string().trim().min(1),
    sizeBytes: z.coerce.number().int().min(1).max(200 * 1024 * 1024),
  }),
  z.object({
    action: z.literal('complete'),
    key: z.string().trim().min(1),
    mimeType: z.string().trim().min(1),
    sizeBytes: z.coerce.number().int().min(1).max(200 * 1024 * 1024),
  }),
]);

export const mediaQuerySchema = paginationQuerySchema.extend({
  kind: z.enum(['image', 'video']).optional(),
});

export const adminResourceParamsSchema = objectIdParamsSchema;

export const adminJobNameParamsSchema = z.object({
  jobName: z.string().trim().min(1).max(64),
});

export const emptyMutationBodySchema = z.object({}).strict().optional().default({});

export { adminContentQuerySchema, publishStatusSchema, questionReviewSchema, questionMergeSchema } from './questionImportValidators.js';

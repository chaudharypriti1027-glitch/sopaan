import { z } from 'zod';

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const plannerSessionsQuerySchema = dateQuerySchema.merge(paginationQuerySchema);

export const plannerSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  startTime: z.string().trim().min(1),
  durationMin: z.number().int().min(1),
  subject: z.string().trim().min(1),
  topic: z.string().trim().optional(),
  type: z.string().trim().min(1),
  reason: z.string().trim().optional(),
  motivation: z.string().trim().optional(),
  completed: z.boolean().optional(),
});

export const plannerUpdateSchema = plannerSessionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

export const plannerGenerateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const focusLogSchema = z.object({
  focusMinutes: z.number().min(0),
  breaksTaken: z.number().int().min(0).default(0),
  sessions: z.number().int().min(0).default(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const gameCompleteSchema = z.object({
  gameId: z.enum([
    'memory-match',
    'word-scramble',
    'gk-bingo',
    'rapid-fire',
    'crossword',
    'map-quiz',
    'math-blitz',
    'grammar-fix',
    'science-lab',
    'history-line',
    'spelling-bee',
    'flag-master',
    'logic-puzzle',
    'number-ninja',
    'word-chain',
    'world-quiz',
    'trivia-blitz',
    'code-breaker',
    'story-builder',
  ]),
  score: z.number().int().min(0).max(1000),
});

export const physicalLogSchema = z.object({
  testType: z.string().trim().min(1),
  value: z.number(),
  unit: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const physicalStandardsQuerySchema = z.object({
  goal: z.string().trim().min(1).optional(),
});

export const pushTokenSchema = z.object({
  token: z.string().trim().min(1),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});

export const pushSettingsSchema = z.object({
  enabled: z.boolean(),
});

export const notificationTrackOpenSchema = z
  .object({
    notificationId: z.string().trim().optional(),
    campaignId: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.notificationId || data.campaignId), {
    message: 'notificationId or campaignId is required',
  });

export const alertPreferencesSchema = z.object({
  currentAffairsAlerts: z.boolean(),
});

const notificationTypeKeySchema = z.enum([
  'rank_up',
  'streak_reminder',
  'new_current_affairs',
  'plan_ready',
  'mock_live',
  'progress_recap',
  'badge',
  'reward',
  'mentor',
  'premium_activated',
]);

export const notificationPreferencesSchema = z.object({
  currentAffairsAlerts: z.boolean().optional(),
  dailyPushCap: z.number().int().min(1).max(50).optional(),
  types: z.record(notificationTypeKeySchema, z.boolean()).optional(),
  quietHours: z
    .object({
      enabled: z.boolean().optional(),
      start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      timezone: z.string().trim().min(1).optional(),
    })
    .optional(),
});

export const doubtCreateSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  subject: z.string().trim().min(1),
});

export const doubtAnswerSchema = z.object({
  body: z.string().trim().min(1),
});

export const doubtVoteSchema = z
  .object({
    target: z.enum(['post', 'answer']).default('post'),
    answerId: z.string().optional(),
  })
  .refine((data) => data.target !== 'answer' || data.answerId, {
    message: 'answerId is required when target is answer',
  });

export const groupCreateSchema = z.object({
  name: z.string().trim().min(1),
  examTag: z.string().trim().min(1),
});

const communityQuestionSchema = z.object({
  text: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        text: z.string().trim().min(1),
      })
    )
    .length(4),
  correctKey: z.string().trim().min(1),
  explanation: z.string().trim().optional(),
});

export const communityTestCreateSchema = z
  .object({
    title: z.string().trim().min(1),
    subject: z.string().trim().min(1),
    topic: z.string().trim().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    durationSec: z.number().int().min(60),
    examTag: z.string().trim().min(1),
    status: z.enum(['draft', 'published']).default('draft'),
    questionIds: z.array(z.string().min(1)).optional(),
    questions: z.array(communityQuestionSchema).optional(),
  })
  .refine((data) => (data.questionIds?.length ?? 0) > 0 || (data.questions?.length ?? 0) > 0, {
    message: 'Provide questionIds or questions',
  });

export const communityTestsQuerySchema = z.object({
  published: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const mentorBookSchema = z.object({
  slotStart: z.string().min(1, 'slotStart is required'),
});

export const doubtsQuerySchema = paginationQuerySchema.extend({
  subject: z.string().trim().optional(),
});

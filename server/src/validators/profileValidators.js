import { z } from 'zod';

const preferencesSchema = z.object({
  language: z.enum(['en', 'hi', 'gu']).optional(),
  dailyGoalMinutes: z.number().int().min(0).max(1440).optional(),
});

export const updateProfileSchema = z
  .object({
    education: z.string().trim().min(1).optional(),
    category: z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS']).optional(),
    state: z.string().trim().min(1).optional(),
    attemptNumber: z.number().int().min(1).optional(),
    targetYear: z.number().int().min(2000).max(2100).optional(),
    preferences: preferencesSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one profile field is required',
  });

export const updateGoalSchema = z.object({
  examTrack: z.string().trim().min(1, 'examTrack is required'),
  targetYear: z
    .number({ required_error: 'targetYear is required' })
    .int()
    .min(2000)
    .max(2100),
});

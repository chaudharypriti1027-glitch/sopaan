import { z } from 'zod';

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email('Invalid email').optional(),
    avatarUrl: z.union([z.string().trim().url('Invalid avatar URL'), z.literal('')]).optional(),
    state: z.string().trim().min(1).max(80).optional(),
    category: z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS']).optional(),
    targetExam: z.string().trim().min(1).max(120).optional(),
    examDate: z
      .union([z.string().datetime(), z.string().date()])
      .optional()
      .nullable(),
    language: z.enum(['en', 'hi', 'gu']).optional(),
    educationLevel: z.enum(['10th', '12th', 'Graduate', 'PG', 'Diploma', 'Other']).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one profile field is required',
  });

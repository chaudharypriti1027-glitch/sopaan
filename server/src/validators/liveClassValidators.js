import { z } from 'zod';

export const liveClassCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).optional(),
  instructor: z.string().trim().min(1).max(120).optional(),
  instructorId: z.string().trim().optional(),
  examTag: z.string().trim().min(1).max(80),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(15).max(240),
  thumbnailColor: z.string().trim().optional(),
  status: z.enum(['scheduled', 'live']).optional(),
});

export const liveClassStatusSchema = z.object({
  status: z.enum(['scheduled', 'live', 'ended']),
});

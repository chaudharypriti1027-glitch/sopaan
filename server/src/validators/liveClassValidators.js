import { z } from 'zod';
import { paginationQuerySchema } from './contentValidators.js';

export const liveClassCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(1000).optional(),
    educatorId: z.string().trim().optional(),
    instructorId: z.string().trim().optional(),
    instructor: z.string().trim().min(1).max(120).optional(),
    exam: z.string().trim().min(1).max(80).optional(),
    examTag: z.string().trim().min(1).max(80).optional(),
    topic: z.string().trim().max(120).optional(),
    startsAt: z.coerce.date().optional(),
    scheduledAt: z.coerce.date().optional(),
    durationMin: z.coerce.number().int().min(15).max(240),
    coverUrl: z.string().trim().url().optional(),
    thumbnailUrl: z.string().trim().url().optional(),
    thumbnailColor: z.string().trim().optional(),
    autoRecord: z.boolean().optional(),
    notify: z.boolean().optional(),
    status: z.enum(['scheduled', 'live']).optional(),
  })
  .refine((data) => Boolean(data.exam || data.examTag), {
    message: 'exam is required',
    path: ['exam'],
  })
  .refine((data) => Boolean(data.startsAt || data.scheduledAt), {
    message: 'startsAt is required',
    path: ['startsAt'],
  });

export const liveClassUpdateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  topic: z.string().trim().max(120).optional(),
  exam: z.string().trim().min(1).max(80).optional(),
  startsAt: z.coerce.date().optional(),
  durationMin: z.coerce.number().int().min(15).max(240).optional(),
  coverUrl: z.union([z.string().trim().url(), z.literal(''), z.null()]).optional(),
  autoRecord: z.boolean().optional(),
  status: z.enum(['cancelled']).optional(),
});

export const adminLiveClassQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
});

/** @deprecated use liveClassUpdateSchema or start/end endpoints */
export const liveClassStatusSchema = z.object({
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']),
});

export const liveClassRecordingPublishSchema = z.object({
  published: z.boolean(),
});

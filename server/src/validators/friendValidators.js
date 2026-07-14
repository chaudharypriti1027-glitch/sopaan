import { z } from 'zod';
import { paginationQuerySchema } from './featureValidators.js';

export const friendSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(2).max(80),
});

export const friendRequestSchema = z.object({
  userId: z.string().trim().min(1),
});

export const friendRespondSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export const conversationCreateSchema = z.object({
  friendUserId: z.string().trim().min(1),
});

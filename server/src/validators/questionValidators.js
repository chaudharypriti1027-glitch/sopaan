import { z } from 'zod';

export const relatedQuestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

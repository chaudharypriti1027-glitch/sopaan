import { z } from 'zod';

export const flashcardReviewSchema = z.object({
  cardId: z.string().trim().min(1, 'cardId is required'),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
});

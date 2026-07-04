import { z } from 'zod';

export const checkoutOrderSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  couponCode: z.string().trim().min(1).max(32).optional(),
});

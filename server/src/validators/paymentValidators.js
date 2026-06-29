import { z } from 'zod';

export const createOrderSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export const cancelSubscriptionSchema = z.object({
  atPeriodEnd: z.boolean().optional().default(true),
});

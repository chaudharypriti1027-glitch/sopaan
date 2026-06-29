import { z } from 'zod';
import { privacyConfig } from '../config/privacyConfig.js';

export const privacyConsentInputSchema = z.object({
  policyVersion: z.string().trim().min(1).default(privacyConfig.policyVersion),
  aiProcessing: z.literal(true, {
    errorMap: () => ({ message: 'AI processing consent is required to use Sopaan' }),
  }),
  marketing: z.boolean().optional().default(false),
});

export const updateMarketingConsentSchema = z.object({
  marketing: z.boolean(),
});

export const deletionRequestSchema = z
  .object({
    password: z.string().min(1).optional(),
    otpCode: z.string().trim().length(6).optional(),
  })
  .refine((data) => data.password || data.otpCode, {
    message: 'Password or OTP is required',
    path: ['password'],
  });

export const deletionConfirmSchema = z.object({
  deletionToken: z.string().min(1),
  confirmPhrase: z.string().trim().min(1),
  refreshToken: z.string().min(1).optional(),
});

import { z } from 'zod';

export const referralCodeSchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export const deferredReferralClickSchema = z.object({
  code: z.string().trim().min(4).max(32),
  installId: z.string().trim().min(8).max(128),
});

export const referralClaimSchema = z.object({
  installId: z.string().trim().min(8).max(128),
});

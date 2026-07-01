import { z } from 'zod';
import { privacyConfig } from '../config/privacyConfig.js';
import { isValidIndianPhone } from '../utils/phone.js';

const indianPhoneSchema = z
  .string({ required_error: 'Phone is required' })
  .trim()
  .min(10, 'Phone must be at least 10 digits')
  .refine(isValidIndianPhone, { message: 'Invalid Indian phone number' });

const otpCodeSchema = z
  .string({ required_error: 'OTP code is required' })
  .trim()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

export const privacyConsentInputSchema = z.object({
  policyVersion: z.string().trim().min(1).default(privacyConfig.policyVersion),
  aiProcessing: z.literal(true, {
    errorMap: () => ({ message: 'AI processing consent is required' }),
  }),
  marketing: z.boolean().optional().default(false),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    phone: indianPhoneSchema.optional(),
    email: z.string().trim().email('Invalid email'),
    password: passwordSchema,
    referralCode: z.string().trim().min(4).max(32).optional(),
    installId: z.string().trim().min(8).max(128).optional(),
    privacyConsent: privacyConsentInputSchema,
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    phone: indianPhoneSchema.optional(),
    email: z.string().trim().email('Invalid email').optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: 'Phone or email is required',
    path: ['phone'],
  });

export const setPasswordSchema = z.object({
  password: passwordSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const requestOtpSchema = z.object({
  phone: indianPhoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  code: otpCodeSchema,
});

/** @deprecated prefer requestOtpSchema */
export const otpRequestSchema = requestOtpSchema;

export const googleAuthSchema = z.object({
  idToken: z.string().trim().min(20, 'Google ID token is required'),
  referralCode: z.string().trim().min(4).max(32).optional(),
  installId: z.string().trim().min(8).max(128).optional(),
  privacyConsent: privacyConsentInputSchema.optional(),
});

/** Legacy OTP verify — optional referral / consent fields for old clients. */
export const otpVerifySchema = verifyOtpSchema.extend({
  referralCode: z.string().trim().min(4).max(32).optional(),
  installId: z.string().trim().min(8).max(128).optional(),
  privacyConsent: privacyConsentInputSchema.optional(),
});

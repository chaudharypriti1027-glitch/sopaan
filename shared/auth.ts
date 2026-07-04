/**
 * Auth + profile — single source of truth (server + mobile).
 * Login / OTP responses return AuthResult.
 */

export type ProfileCategory = 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type ProfileLanguage = 'en' | 'hi' | 'gu';
export type EducationLevel = '10th' | '12th' | 'Graduate' | 'PG' | 'Diploma' | 'Other';

export interface Profile {
  id: string;
  name: string;
  /** +91xxxxxxxxxx (login identity) */
  phone: string;
  email?: string;
  avatarUrl?: string;
  /** e.g. "Gujarat" */
  state: string;
  category?: ProfileCategory;
  /** e.g. "SSC CGL" */
  targetExam: string;
  /** ISO */
  examDate?: string;
  language: ProfileLanguage;
  educationLevel?: EducationLevel;
  createdAt: string;
  /** Live stats shown on profile (filled by other services). */
  streak?: number;
  rank?: number | null;
  level?: number;
  coins?: number;
  /** True once name, state, and targetExam are saved via PUT /api/me. */
  onboardingComplete?: boolean;
  /** App access level — used for admin dashboard and pro bypass. */
  role?: 'user' | 'student' | 'creator' | 'moderator' | 'admin';
  isPremium?: boolean;
  premiumPlan?: 'monthly' | 'yearly' | 'trial' | null;
  premiumExpiresAt?: string | null;
}

export interface AuthResult {
  token: string;
  refreshToken: string;
  profile: Profile;
  isNewUser: boolean;
}

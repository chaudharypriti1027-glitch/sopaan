import { describe, expect, it } from '@jest/globals';
import { needsPostOtpProfileCompletion } from '../signupFlow';
import type { Profile } from '../../types/auth';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '1',
    name: 'Student',
    phone: '+919876543210',
    state: '',
    targetExam: '',
    language: 'en',
    createdAt: '',
    ...overrides,
  };
}

describe('needsPostOtpProfileCompletion', () => {
  it('returns true for OTP users with placeholder name', () => {
    expect(needsPostOtpProfileCompletion(profile())).toBe(true);
  });

  it('returns false for email signups without phone', () => {
    expect(
      needsPostOtpProfileCompletion(
        profile({ name: 'Asha Kumar', phone: '', email: 'asha@example.com' }),
      ),
    ).toBe(false);
  });

  it('returns false once a real name is saved', () => {
    expect(needsPostOtpProfileCompletion(profile({ name: 'Arjun Patel' }))).toBe(false);
  });
});

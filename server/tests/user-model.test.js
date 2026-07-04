import { User } from '../src/models/User.js';
import { OtpToken } from '../src/models/OtpToken.js';

describe('User model', () => {
  it('toProfile returns shared Profile shape without passwordHash', () => {
    const user = new User({
      name: 'Priya Sharma',
      phone: '+919876543210',
      email: 'priya@example.com',
      avatarUrl: 'https://cdn.example.com/a.jpg',
      state: 'Gujarat',
      category: 'OBC',
      targetExam: 'SSC CGL',
      examDate: new Date('2026-06-01T00:00:00.000Z'),
      language: 'gu',
      educationLevel: 'Graduate',
      rank: 1234,
      level: 5,
      coins: 120,
      streak: { current: 7, best: 12, freezes: 1, lastActiveOn: new Date() },
    });
    user.createdAt = new Date('2026-01-15T08:00:00.000Z');

    const profile = user.toProfile();

    expect(profile).toEqual({
      id: String(user._id),
      name: 'Priya Sharma',
      phone: '+919876543210',
      email: 'priya@example.com',
      avatarUrl: 'https://cdn.example.com/a.jpg',
      state: 'Gujarat',
      category: 'OBC',
      targetExam: 'SSC CGL',
      examDate: '2026-06-01T00:00:00.000Z',
      language: 'gu',
      educationLevel: 'Graduate',
      createdAt: '2026-01-15T08:00:00.000Z',
      streak: 7,
      rank: 1234,
      level: 5,
      coins: 120,
      onboardingComplete: false,
      role: 'student',
      isPremium: false,
    });
    expect(profile.passwordHash).toBeUndefined();
  });

  it('toProfile omits optional fields when unset', () => {
    const user = new User({
      name: 'Test',
      phone: '+919000000001',
    });

    const profile = user.toProfile();

    expect(profile.email).toBeUndefined();
    expect(profile.avatarUrl).toBeUndefined();
    expect(profile.category).toBeUndefined();
    expect(profile.examDate).toBeUndefined();
    expect(profile.educationLevel).toBeUndefined();
    expect(profile.streak).toBeUndefined();
    expect(profile.state).toBe('');
    expect(profile.targetExam).toBe('');
    expect(profile.language).toBe('en');
    expect(profile.rank).toBeNull();
    expect(profile.role).toBe('student');
    expect(profile.isPremium).toBe(false);
  });
});

describe('OtpToken model', () => {
  it('defines TTL index on expiresAt', () => {
    const ttlIndex = OtpToken.schema.indexes().find(
      ([fields]) => fields.expiresAt === 1,
    );

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1]).toMatchObject({ expireAfterSeconds: 0 });
  });
});

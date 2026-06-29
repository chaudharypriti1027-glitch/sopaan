import { Question } from '../../src/models/Question.js';
import { Test } from '../../src/models/Test.js';
import { User } from '../../src/models/User.js';
import { nextTestPhoneE164 } from './privacy.js';

const defaultOptions = [
  { key: 'A', text: 'Option A' },
  { key: 'B', text: 'Option B' },
  { key: 'C', text: 'Option C' },
  { key: 'D', text: 'Option D' },
];

export async function createPublishedTest(userId, overrides = {}) {
  const questions = await Question.insertMany([
    {
      subject: 'Quant',
      topic: 'Percentages',
      difficulty: 'easy',
      text: 'What is 50% of 200?',
      options: defaultOptions,
      correctKey: 'B',
      explanation: '50% of 200 is 100.',
      source: 'official',
      createdBy: userId,
    },
    {
      subject: 'Quant',
      topic: 'Ratios',
      difficulty: 'medium',
      text: 'Simplify the ratio 2:4.',
      options: defaultOptions,
      correctKey: 'A',
      explanation: '2:4 simplifies to 1:2.',
      source: 'official',
      createdBy: userId,
    },
  ]);

  const test = await Test.create({
    title: 'Fixture Mock Test',
    subject: 'Quant',
    topic: 'Mixed',
    difficulty: 'easy',
    durationSec: 600,
    questions: questions.map((question) => question._id),
    type: 'mock',
    examTag: 'SSC CGL',
    createdBy: userId,
    status: 'published',
    ...overrides,
  });

  return { test, questions };
}

export async function createTestUser(overrides = {}) {
  const phone = overrides.phone ?? nextTestPhoneE164();
  const payload = {
    name: 'Test User',
    email: overrides.email ?? `user_${Date.now()}_${phone.slice(-4)}@test.com`,
    phone,
    role: 'student',
    ...overrides,
  };

  if (payload.passwordHash && !overrides.password) {
    return User.create(payload);
  }

  const user = new User(payload);
  await user.setPassword(overrides.password ?? 'Password123');
  await user.save();
  return user;
}

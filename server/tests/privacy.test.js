import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Attempt } from '../src/models/Attempt.js';
import { StudentProfile } from '../src/models/StudentProfile.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';
import { privacyConfig } from '../src/config/privacyConfig.js';
import { stripContactPatterns, sanitizeAiUserText } from '../src/services/ai/piiMinimizer.js';

async function signupUser(overrides = {}) {
  const payload = withPrivacyConsent({
    name: 'Privacy Test User',
    email: 'privacy@example.com',
    password: 'Password123',
    ...overrides,
  });

  const response = await request(app).post('/api/auth/signup').send(payload);
  return response;
}

describe('Privacy API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns public privacy policy', async () => {
    const response = await request(app).get('/api/privacy/policy');

    expect(response.status).toBe(200);
    expect(response.body.version).toBe(privacyConfig.policyVersion);
    expect(response.body.sections).toEqual(expect.any(Array));
    expect(response.body.sections.some((s) => s.id === 'processors')).toBe(true);
  });

  it('requires privacy consent on signup', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      name: 'No Consent',
      email: 'noconsent@example.com',
      password: 'Password123',
    });

    expect(response.status).toBe(400);
  });

  it('stores consent on signup', async () => {
    const signup = await signupUser();
    expect(signup.status).toBe(201);

    const user = await User.findOne({ email: 'privacy@example.com' });
    expect(user.privacyConsent.aiProcessing).toBe(true);
    expect(user.privacyConsent.policyVersion).toBeTruthy();
  });

  it('exports user data as JSON', async () => {
    const signup = await signupUser();
    const token = signup.body.accessToken;

    await StudentProfile.create({
      userId: signup.body.user.id,
      education: 'Graduate',
      category: 'GEN',
    });

    const response = await request(app)
      .get('/api/privacy/export')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('privacy@example.com');
    expect(response.body.profile.education).toBe('Graduate');
    expect(response.body.dataInventory).toBeTruthy();
  });

  it('deletes account after confirmation flow', async () => {
    const signup = await signupUser({ email: 'delete@example.com' });
    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    await Attempt.create({
      userId,
      testId: new mongoose.Types.ObjectId(),
      answers: [],
      score: 0,
      accuracy: 0,
      totalTimeSec: 60,
    });

    const requestDeletion = await request(app)
      .post('/api/privacy/deletion/request')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Password123' });

    expect(requestDeletion.status).toBe(200);
    expect(requestDeletion.body.deletionToken).toEqual(expect.any(String));

    const confirm = await request(app)
      .post('/api/privacy/deletion/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deletionToken: requestDeletion.body.deletionToken,
        confirmPhrase: privacyConfig.deletionConfirmPhrase,
        refreshToken: signup.body.refreshToken,
      });

    expect(confirm.status).toBe(200);

    const user = await User.findById(userId);
    expect(user.accountStatus).toBe('deleted');
    expect(user.email).toBeFalsy();
    expect(user.name).toBe('Deleted user');

    const attempts = await Attempt.countDocuments({ userId });
    expect(attempts).toBe(0);

    const profile = await StudentProfile.findOne({ userId });
    expect(profile).toBeNull();

    const authAfter = await request(app)
      .get('/api/privacy/export')
      .set('Authorization', `Bearer ${token}`);

    expect(authAfter.status).toBe(401);
  });

  it('updates marketing consent', async () => {
    const signup = await signupUser({ email: 'marketing@example.com' });
    const token = signup.body.accessToken;

    const response = await request(app)
      .patch('/api/privacy/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketing: true });

    expect(response.status).toBe(200);
    expect(response.body.consent.marketing).toBe(true);
  });
});

describe('AI PII minimizer', () => {
  it('strips email and phone patterns', () => {
    expect(stripContactPatterns('Contact me at test@example.com or 9876543210')).toContain('[email]');
    expect(stripContactPatterns('Contact me at test@example.com or 9876543210')).toContain('[phone]');
  });

  it('sanitizes user text', () => {
    expect(sanitizeAiUserText('  hello@test.com  ')).toBe('[email]');
  });
});

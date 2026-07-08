import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Test } from '../src/models/Test.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

describe('Search API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns grouped matches for exams, courses, and tests', async () => {
    const signup = await request(app).post('/api/auth/signup').send(
      withPrivacyConsent({
        name: 'Searcher',
        email: 'search@example.com',
        password: 'Password123!',
      }),
    );

    const token = signup.body.accessToken;

    await Course.create({
      title: 'Polity Masterclass',
      subject: 'Polity',
      examTags: ['SSC-CGL'],
      language: 'en',
      status: 'published',
      lessons: [{ title: 'Intro', order: 1 }],
    });

    await Test.create({
      title: 'Polity Sectional Mock',
      subject: 'Polity',
      difficulty: 'easy',
      durationSec: 600,
      type: 'sectional',
      examTag: 'SSC-CGL',
      createdBy: signup.body.user.id,
      status: 'published',
    });

    const response = await request(app)
      .get('/api/search')
      .query({ q: 'polity' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.query).toBe('polity');
    expect(response.body.results.courses.length).toBeGreaterThanOrEqual(1);
    expect(response.body.results.tests.length).toBeGreaterThanOrEqual(1);
  });
});

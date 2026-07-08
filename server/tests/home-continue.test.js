import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Progress } from '../src/models/Progress.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';
import { createPublishedCourse } from './helpers/content.js';

describe('Home continue progress', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('populates continue[] after course lesson progress is saved', async () => {
    const signup = await request(app).post('/api/auth/signup').send(
      withPrivacyConsent({
        name: 'Continue User',
        email: 'continue@example.com',
        password: 'Password123!',
      }),
    );

    const token = signup.body.accessToken;
    const userId = signup.body.user.id;

    const course = await createPublishedCourse({
      title: 'Polity Basics',
      subject: 'Polity',
      lessons: [{ title: 'Intro', durationMin: 10 }],
    });

    const lessonId = course.lessons[0]._id.toString();

    const progressRes = await request(app)
      .post(`/api/courses/${course._id}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lessonId, completed: true });

    expect(progressRes.status).toBe(200);

    const row = await Progress.findOne({
      user: new mongoose.Types.ObjectId(userId),
      kind: 'lesson',
      refId: course._id,
    }).lean();

    expect(row).toBeTruthy();
    expect(row.title).toBe('Polity Basics');
    expect(row.deeplink).toBe(`/stack/CourseDetail/${course._id.toString()}`);

    const home = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${token}`);

    expect(home.status).toBe(200);
    expect(home.body.continue.length).toBeGreaterThanOrEqual(1);
    expect(home.body.continue[0].title).toBe('Polity Basics');
  });
});

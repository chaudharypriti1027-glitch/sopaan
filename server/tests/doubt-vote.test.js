import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { DoubtPost } from '../src/models/DoubtPost.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('Doubt vote API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function authToken() {
    const user = await createTestUser({
      name: 'Voter',
      email: `voter_${Date.now()}@test.com`,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123!' })
      .expect(200);

    return { token: login.body.token, user };
  }

  it('rejects invalid doubt ids with 400', async () => {
    const { token } = await authToken();

    const response = await request(app)
      .post('/api/doubts/not-a-valid-id/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ target: 'post' });

    expect(response.status).toBe(400);
  });

  it('allows only one vote per user on a doubt post', async () => {
    const author = await createTestUser({
      name: 'Author',
      email: `author_${Date.now()}@test.com`,
    });
    const { token } = await authToken();

    const doubt = await DoubtPost.create({
      userId: author._id,
      title: 'Ratio doubt',
      body: 'How to solve ratio problems?',
      subject: 'Quant',
    });

    const first = await request(app)
      .post(`/api/doubts/${doubt._id}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ target: 'post' })
      .expect(200);

    expect(first.body.votes).toBe(1);

    const second = await request(app)
      .post(`/api/doubts/${doubt._id}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ target: 'post' })
      .expect(200);

    expect(second.body.votes).toBe(1);
  });
});

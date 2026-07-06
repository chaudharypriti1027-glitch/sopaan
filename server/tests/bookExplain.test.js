import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Book, Chapter, Page } from '../src/models/index.js';
import { buildExplainCacheKey } from '../src/services/bookExplainService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('POST /api/books/:id/explain', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function loginToken(user) {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123!' })
      .expect(200);
    return login.body.token;
  }

  async function seedBook() {
    const admin = await createTestUser({ name: 'Admin', email: 'explain-admin@test.com', role: 'admin' });
    const book = await Book.create({
      title: 'Explain Me',
      slug: 'explain-me',
      subject: 'quant',
      status: 'published',
      createdBy: admin._id,
    });
    const chapter = await Chapter.create({ bookId: book._id, order: 1, title: 'Intro' });
    await Page.create({
      bookId: book._id,
      chapterId: chapter._id,
      order: 1,
      html: '<p>Compound interest grows on principal plus accumulated interest.</p>',
      plainText: 'Compound interest grows on principal plus accumulated interest.',
    });
    return book;
  }

  it('requires authentication', async () => {
    const book = await seedBook();
    const response = await request(app)
      .post(`/api/books/${book._id}/explain`)
      .send({ page: 1, text: 'Compound interest' });
    expect(response.status).toBe(401);
  });

  it('validates passage length', async () => {
    const viewer = await createTestUser({ name: 'Reader', email: 'explain-reader@test.com' });
    const book = await seedBook();
    const token = await loginToken(viewer);

    const response = await request(app)
      .post(`/api/books/${book._id}/explain`)
      .set('Authorization', `Bearer ${token}`)
      .send({ page: 1, text: '  ' });

    expect(response.status).toBe(400);
  });

  it('streams an explanation via SSE with stub AI', async () => {
    const viewer = await createTestUser({ name: 'Reader', email: 'explain-stream@test.com' });
    const book = await seedBook();
    const token = await loginToken(viewer);

    const response = await request(app)
      .post(`/api/books/${book._id}/explain`)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'text/event-stream')
      .send({ page: 1, text: 'Compound interest grows on principal plus accumulated interest.' })
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/event-stream/);
    expect(response.text).toContain('"type":"delta"');
    expect(response.text).toContain('"type":"done"');
    expect(response.text).toContain('Remember this');
  });

  it('builds deterministic cache keys', () => {
    const keyA = buildExplainCacheKey('507f1f77bcf86cd799439011', 'Same passage');
    const keyB = buildExplainCacheKey('507f1f77bcf86cd799439011', 'Same passage');
    const keyC = buildExplainCacheKey('507f1f77bcf86cd799439011', 'Different passage');

    expect(keyA).toBe(keyB);
    expect(keyA).toMatch(/^explain:507f1f77bcf86cd799439011:[a-f0-9]{40}$/);
    expect(keyC).not.toBe(keyA);
  });
});

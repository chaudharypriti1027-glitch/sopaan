import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Book, BookGenJob, Chapter, Page } from '../src/models/index.js';
import { runBookGenJob } from '../src/workers/bookGen.worker.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('Admin book generation', () => {
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

  const generatePayload = {
    title: 'Fast-Track Quant',
    subject: 'quant',
    audience: 'SSC CGL aspirants',
    chapters: ['Number System', 'Percentages'],
    isPro: false,
    coverTheme: 'navy',
  };

  it('requires admin role', async () => {
    const viewer = await createTestUser({ name: 'Reader', email: 'reader-gen@test.com' });
    const token = await loginToken(viewer);

    const response = await request(app)
      .post('/api/admin/books/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(generatePayload);

    expect(response.status).toBe(403);
  });

  it('validates chapter count and body fields', async () => {
    const admin = await createTestUser({ name: 'Admin', email: 'admin-gen@test.com', role: 'admin' });
    const token = await loginToken(admin);

    const response = await request(app)
      .post('/api/admin/books/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...generatePayload, chapters: [] });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates draft book and queued job', async () => {
    const admin = await createTestUser({ name: 'Admin', email: 'admin-gen2@test.com', role: 'admin' });
    const token = await loginToken(admin);

    const response = await request(app)
      .post('/api/admin/books/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(generatePayload)
      .expect(202);

    expect(response.body.bookId).toBeDefined();
    expect(response.body.jobId).toBeDefined();

    const book = await Book.findById(response.body.bookId).lean();
    expect(book).toMatchObject({
      title: 'Fast-Track Quant',
      subject: 'quant',
      status: 'draft',
      source: 'ai',
      isPro: false,
      coverTheme: 'navy',
    });

    const job = await BookGenJob.findById(response.body.jobId).lean();
    expect(job?.state).toBe('queued');
    expect(job?.spec.chapters).toHaveLength(2);
  });

  it('runs worker chapter-by-chapter and exposes job status', async () => {
    const admin = await createTestUser({ name: 'Admin', email: 'admin-gen3@test.com', role: 'admin' });
    const token = await loginToken(admin);

    const created = await request(app)
      .post('/api/admin/books/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(generatePayload)
      .expect(202);

    await runBookGenJob({ jobId: created.body.jobId });

    const status = await request(app)
      .get(`/api/admin/books/${created.body.jobId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(status.body.state).toBe('done');
    expect(status.body.progress).toBe(100);

    const chapters = await Chapter.find({ bookId: created.body.bookId }).sort({ order: 1 }).lean();
    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe('Number System');

    const pages = await Page.find({ bookId: created.body.bookId }).sort({ order: 1 }).lean();
    expect(pages.length).toBeGreaterThanOrEqual(2);
    pages.forEach((page) => {
      expect(page.html).not.toMatch(/<script/i);
      expect(page.plainText.length).toBeGreaterThan(0);
    });

    const book = await Book.findById(created.body.bookId).lean();
    expect(book?.pages).toBe(pages.length);
  });

  it('publishes a generated draft book', async () => {
    const admin = await createTestUser({ name: 'Admin', email: 'admin-gen4@test.com', role: 'admin' });
    const token = await loginToken(admin);

    const created = await request(app)
      .post('/api/admin/books/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...generatePayload, chapters: ['Intro'] })
      .expect(202);

    await runBookGenJob({ jobId: created.body.jobId });

    const published = await request(app)
      .post(`/api/admin/books/${created.body.bookId}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(published.body.book.status).toBe('published');

    const listed = await request(app)
      .get('/api/books?sort=popular')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listed.body.items.some((item) => item.id === created.body.bookId)).toBe(true);
  });
});

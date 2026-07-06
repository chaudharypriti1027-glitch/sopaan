import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Book, Bookmark, Chapter, Page, ReadingProgress } from '../src/models/index.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('Library API', () => {
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

  async function seedPublishedBooks() {
    const admin = await createTestUser({ name: 'Admin', email: 'admin-lib@test.com', role: 'admin' });
    const published = await Book.create({
      title: 'Quant Master',
      slug: 'quant-master',
      author: 'Sopaan',
      subject: 'quant',
      coverTheme: 'navy',
      pages: 200,
      rating: 4.8,
      ratingsCount: 120,
      isPro: false,
      status: 'published',
      tags: ['quant'],
      createdBy: admin._id,
    });
    const proBook = await Book.create({
      title: 'Pro Polity',
      slug: 'pro-polity',
      author: 'Sopaan',
      subject: 'gk',
      coverTheme: 'gold',
      pages: 120,
      rating: 4.9,
      ratingsCount: 88,
      isPro: true,
      status: 'published',
      tags: ['polity'],
      createdBy: admin._id,
    });
    await Book.create({
      title: 'June CA PDF',
      slug: 'june-ca-pdf',
      author: 'Sopaan',
      subject: 'current_affairs',
      coverTheme: 'rust',
      pages: 48,
      rating: 4.5,
      ratingsCount: 40,
      isPro: false,
      status: 'published',
      tags: ['pdf', 'notes'],
      createdBy: admin._id,
    });
    await Book.create({
      title: 'Draft Only',
      slug: 'draft-only',
      author: 'Hidden',
      subject: 'gk',
      status: 'draft',
      createdBy: admin._id,
    });
    const chapters = await Chapter.insertMany([
      { bookId: published._id, order: 1, title: 'Intro' },
      { bookId: published._id, order: 2, title: 'Shortcuts' },
    ]);
    const proChapter = await Chapter.create({
      bookId: proBook._id,
      order: 1,
      title: 'Constitution',
    });
    await Page.insertMany([
      {
        bookId: published._id,
        chapterId: chapters[0]._id,
        order: 1,
        html: '<p>Intro page</p>',
        plainText: 'Intro page',
      },
      {
        bookId: proBook._id,
        chapterId: proChapter._id,
        order: 1,
        html: '<p>Preview 1</p><script>evil()</script>',
        plainText: 'Preview 1',
      },
      {
        bookId: proBook._id,
        chapterId: proChapter._id,
        order: 2,
        html: '<p>Preview 2</p>',
        plainText: 'Preview 2',
      },
      {
        bookId: proBook._id,
        chapterId: proChapter._id,
        order: 3,
        html: '<p>Locked page</p>',
        plainText: 'Locked page',
      },
    ]);
    return { admin, published, proBook, proChapter, chapters };
  }

  it('requires authentication', async () => {
    const response = await request(app).get('/api/books');
    expect(response.status).toBe(401);
  });

  it('lists only published books with user progress flags', async () => {
    const viewer = await createTestUser({ name: 'Reader', email: 'reader@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    await ReadingProgress.create({
      userId: viewer._id,
      bookId: published._id,
      lastPage: 12,
      percent: 42,
    });

    const response = await request(app)
      .get('/api/books?sort=popular')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.items).toHaveLength(3);
    expect(response.body.total).toBe(3);
    expect(response.body.page).toBe(1);
    expect(response.body.hasMore).toBe(false);

    const quant = response.body.items.find((item) => item.slug === undefined && item.title === 'Quant Master');
    expect(quant).toMatchObject({
      title: 'Quant Master',
      subject: 'quant',
      coverTheme: 'navy',
      isDownloaded: false,
      inProgress: true,
      progressPercent: 42,
    });
  });

  it('returns subject counts for published books', async () => {
    const viewer = await createTestUser({ name: 'Grid', email: 'grid@test.com' });
    await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get('/api/books/subjects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.subjects).toEqual(
      expect.arrayContaining([
        { subject: 'quant', count: 1 },
        { subject: 'current_affairs', count: 1 },
      ]),
    );
  });

  it('returns book detail with chapters and progress', async () => {
    const viewer = await createTestUser({ name: 'Detail', email: 'detail@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${published._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.book.title).toBe('Quant Master');
    expect(response.body.chapters).toHaveLength(2);
    expect(response.body.chapters[0]).toMatchObject({ order: 1, title: 'Intro' });
    expect(response.body.progress).toBeNull();
  });

  it('filters notes type separately from books', async () => {
    const viewer = await createTestUser({ name: 'Notes', email: 'notes@test.com' });
    await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get('/api/books?type=notes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].title).toBe('June CA PDF');
  });

  it('returns chapter pages with Pro preview gating', async () => {
    const viewer = await createTestUser({ name: 'Preview', email: 'preview@test.com' });
    const { proBook, proChapter } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${proBook._id}/chapters/${proChapter._id}/pages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.locked).toBe(true);
    expect(response.body.pages).toHaveLength(2);
    expect(response.body.pages[0].html).toBe('<p>Preview 1</p>');
    expect(response.body.totalPages).toBe(3);
  });

  it('blocks deep-linked Pro pages beyond preview', async () => {
    const viewer = await createTestUser({ name: 'Deep', email: 'deep@test.com' });
    const { proBook } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${proBook._id}/pages/3`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe('PRO_REQUIRED');
  });

  it('upserts reading progress for the current user', async () => {
    const viewer = await createTestUser({ name: 'Progress', email: 'progress@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .put(`/api/books/${published._id}/progress`)
      .set('Authorization', `Bearer ${token}`)
      .send({ page: 8, line: 2, percent: 33 })
      .expect(200);

    expect(response.body).toMatchObject({
      lastPage: 8,
      lastLine: 2,
      percent: 33,
    });
  });

  it('creates, lists, and deletes bookmarks', async () => {
    const viewer = await createTestUser({ name: 'Marks', email: 'marks@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const created = await request(app)
      .post(`/api/books/${published._id}/bookmarks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ page: 4, line: 1, note: 'Important' })
      .expect(201);

    expect(created.body.page).toBe(4);
    expect(created.body.note).toBe('Important');

    const listed = await request(app)
      .get(`/api/books/${published._id}/bookmarks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listed.body.bookmarks).toHaveLength(1);

    await request(app)
      .delete(`/api/books/${published._id}/bookmarks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterDelete = await Bookmark.countDocuments({ userId: viewer._id, bookId: published._id });
    expect(afterDelete).toBe(0);
  });

  it('returns bundled reader content in one request', async () => {
    const viewer = await createTestUser({ name: 'Reader', email: 'reader-bundle@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${published._id}/reader`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.book.title).toBe('Quant Master');
    expect(response.body.chapters).toHaveLength(2);
    expect(response.body.pages).toHaveLength(1);
    expect(response.body.pages[0].chapterTitle).toBe('Intro');
    expect(response.body.pages[0].html).toContain('Intro page');
  });

  it('downloads a free book bundle and marks isDownloaded in list', async () => {
    const viewer = await createTestUser({ name: 'Dl', email: 'dl@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const download = await request(app)
      .get(`/api/books/${published._id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(download.body.book.title).toBe('Quant Master');
    expect(download.body.chapters).toHaveLength(2);
    expect(download.body.pages).toHaveLength(1);
    expect(download.body.pages[0].plainText).toBe('Intro page');
    expect(download.body.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(download.body.bundleVersion).toBeTruthy();

    const list = await request(app)
      .get('/api/books?sort=popular')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const quant = list.body.items.find((item) => item.title === 'Quant Master');
    expect(quant?.isDownloaded).toBe(true);
  });

  it('blocks Pro book download without subscription', async () => {
    const viewer = await createTestUser({ name: 'Free', email: 'free-dl@test.com' });
    const { proBook } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${proBook._id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe('PRO_REQUIRED');
  });

  it('allows Pro subscribers to download Pro books', async () => {
    const viewer = await createTestUser({
      name: 'Pro',
      email: 'pro-dl@test.com',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 86400000),
    });
    const { proBook } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    const response = await request(app)
      .get(`/api/books/${proBook._id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.pages).toHaveLength(3);
  });

  it('deletes a download record', async () => {
    const viewer = await createTestUser({ name: 'Rm', email: 'rm-dl@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    await request(app)
      .get(`/api/books/${published._id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/books/${published._id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const list = await request(app)
      .get('/api/books?sort=popular')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const quant = list.body.items.find((item) => item.title === 'Quant Master');
    expect(quant?.isDownloaded).toBe(false);
  });

  it('records library analytics events', async () => {
    const viewer = await createTestUser({ name: 'Evt', email: 'evt@test.com' });
    const { published } = await seedPublishedBooks();
    const token = await loginToken(viewer);

    await request(app)
      .post('/api/books/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: 'book_open', bookId: published._id.toString(), metadata: { offline: true } })
      .expect(201);

    const invalid = await request(app)
      .post('/api/books/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: 'invalid_event' })
      .expect(400);

    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });
});

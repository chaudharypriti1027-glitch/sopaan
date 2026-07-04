import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Banner } from '../src/models/Banner.js';
import {
  createAdminBanner,
  getActiveBanner,
  setAdminBannerActive,
} from '../src/services/bannerService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('banners', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns only the active banner for students', async () => {
    const admin = await createTestUser({
      email: 'admin-banner@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const hidden = await createAdminBanner(admin._id, {
      message: 'Hidden banner',
      linkType: 'premium',
    });
    const live = await createAdminBanner(admin._id, {
      message: 'Live sale banner',
      linkType: 'test_series',
    });

    await setAdminBannerActive(hidden.id, true);
    await setAdminBannerActive(live.id, true);

    const active = await getActiveBanner();
    expect(active.banner?.message).toBe('Live sale banner');
    expect(active.banner?.deeplink).toBe('/stack/TestSeries');
    expect(await Banner.countDocuments({ active: true })).toBe(1);
  });

  it('hiding a banner removes it from GET /api/banners', async () => {
    const admin = await createTestUser({
      email: 'admin-banner-hide@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const student = await createTestUser({
      email: 'student-banner@test.com',
      password: 'Password123!',
      role: 'student',
      name: 'Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    const banner = await createAdminBanner(admin._id, {
      message: 'Temporary promo',
      linkType: 'premium',
    });
    await setAdminBannerActive(banner.id, true);

    const visible = await request(app)
      .get('/api/banners')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(visible.body.banner?.message).toBe('Temporary promo');

    await setAdminBannerActive(banner.id, false);

    const hidden = await request(app)
      .get('/api/banners')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(hidden.body.banner).toBeNull();
  });

  it('supports admin banner CRUD and publish', async () => {
    const admin = await createTestUser({
      email: 'admin-banner-http@test.com',
      password: 'Password123!',
      role: 'admin',
      name: 'Admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const created = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        message: 'Independence Day sale',
        linkType: 'premium',
      })
      .expect(201);

    expect(created.body.active).toBe(false);

    const published = await request(app)
      .patch(`/api/admin/banners/${created.body.id}/active`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ active: true })
      .expect(200);

    expect(published.body.active).toBe(true);

    const listed = await request(app)
      .get('/api/admin/banners')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].active).toBe(true);
  });
});

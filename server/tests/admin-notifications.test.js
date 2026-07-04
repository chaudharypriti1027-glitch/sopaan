import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { AdminNotificationSend } from '../src/models/AdminNotificationSend.js';
import { Notification } from '../src/models/Notification.js';
import {
  createAdminNotification,
  executeAdminNotificationSend,
  listAdminNotifications,
} from '../src/services/admin/adminNotificationService.js';
import { markNotificationRead } from '../src/services/notificationService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('admin notifications', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('sends immediately to the selected audience segment', async () => {
    const admin = await createTestUser({
      email: 'admin-send@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    await createTestUser({
      email: 'pro-student@test.com',
      passwordHash: 'hash',
      role: 'student',
      isPremium: true,
      expoPushToken: 'ExponentPushToken[pro]',
      pushNotificationsEnabled: true,
    });

    await createTestUser({
      email: 'free-student@test.com',
      passwordHash: 'hash',
      role: 'student',
      isPremium: false,
      expoPushToken: 'ExponentPushToken[free]',
      pushNotificationsEnabled: true,
    });

    const result = await createAdminNotification(admin._id, {
      title: 'Pro offer',
      body: 'Upgrade today',
      audience: 'pro',
    });

    expect(result.status).toBe('sent');
    expect(result.stats.targeted).toBe(1);
    expect(result.stats.inApp).toBe(1);

    const listed = await listAdminNotifications();
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.stats.openRate).toBe(0);
  });

  it('tracks opens and reports open rate', async () => {
    const admin = await createTestUser({
      email: 'admin-open@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const student = await createTestUser({
      email: 'student-open@test.com',
      passwordHash: 'hash',
      role: 'student',
      expoPushToken: 'ExponentPushToken[student]',
      pushNotificationsEnabled: true,
    });

    const campaign = await createAdminNotification(admin._id, {
      title: 'Open me',
      body: 'Tap to open',
      audience: 'all',
    });

    const notification = await Notification.findOne({ campaignId: campaign.id }).lean();
    expect(notification).toBeTruthy();

    await markNotificationRead(student._id, notification._id.toString());

    const listed = await listAdminNotifications();
    expect(listed.items[0]?.stats.opened).toBe(1);
    expect(listed.items[0]?.stats.openRate).toBeGreaterThan(0);
  });

  it('filters audience by exam', async () => {
    const admin = await createTestUser({
      email: 'admin-exam@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    await createTestUser({
      email: 'ssc-student@test.com',
      passwordHash: 'hash',
      role: 'student',
      targetExam: 'SSC-CGL',
      expoPushToken: 'ExponentPushToken[ssc]',
      pushNotificationsEnabled: true,
    });

    await createTestUser({
      email: 'upsc-student@test.com',
      passwordHash: 'hash',
      role: 'student',
      targetExam: 'UPSC',
      expoPushToken: 'ExponentPushToken[upsc]',
      pushNotificationsEnabled: true,
    });

    const campaign = await AdminNotificationSend.create({
      title: 'SSC tip',
      body: 'Quant shortcut',
      audience: 'byExam',
      exam: 'SSC-CGL',
      sendAt: new Date(),
      status: 'sending',
      createdBy: admin._id,
    });

    const sent = await executeAdminNotificationSend(campaign._id.toString());
    expect(sent.stats.targeted).toBe(1);
    expect(sent.stats.inApp).toBe(1);
  });

  it('exposes POST/GET /api/admin/notifications', async () => {
    const admin = await createTestUser({
      email: 'admin-http@test.com',
      password: 'Password123!',
      role: 'admin',
      name: 'Admin HTTP',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    await createTestUser({
      email: 'student-http@test.com',
      passwordHash: 'hash',
      role: 'student',
      expoPushToken: 'ExponentPushToken[http]',
      pushNotificationsEnabled: true,
    });

    const created = await request(app)
      .post('/api/admin/notifications')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        title: 'HTTP send',
        body: 'From admin API',
        audience: 'all',
      })
      .expect(201);

    expect(created.body.status).toBe('sent');
    expect(created.body.stats.inApp).toBe(1);

    const listed = await request(app)
      .get('/api/admin/notifications')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].title).toBe('HTTP send');
  });
});

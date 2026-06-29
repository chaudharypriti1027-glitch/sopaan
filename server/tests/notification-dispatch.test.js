import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Notification } from '../src/models/Notification.js';
import { dispatchNotification } from '../src/services/notificationService.js';
import { NOTIFICATION_TYPES } from '../src/services/notifications/notificationTypes.js';
import {
  isWithinQuietHours,
  resolveNotificationPreferences,
} from '../src/services/notifications/notificationPolicy.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('notification dispatch policy', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('respects per-type preferences', async () => {
    const user = await createTestUser({
      name: 'Student',
      email: 'student@test.com',
      passwordHash: 'hash',
      role: 'student',
      expoPushToken: 'ExponentPushToken[test]',
      pushNotificationsEnabled: true,
      notificationPreferences: {
        types: {
          [NOTIFICATION_TYPES.STREAK_REMINDER]: false,
        },
      },
    });

    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.STREAK_REMINDER,
      title: 'Keep your streak alive',
      body: 'Study today',
      data: { streakCount: 3 },
    });

    expect(result.notification).toBeTruthy();
    expect(result.push.sent).toBe(false);
    expect(result.push.reason).toBe('type_disabled');
  });

  it('blocks push during quiet hours but still stores in-app notification', async () => {
    const user = await createTestUser({
      name: 'Night Owl',
      email: 'night@test.com',
      passwordHash: 'hash',
      role: 'student',
      expoPushToken: 'ExponentPushToken[test]',
      pushNotificationsEnabled: true,
      notificationPreferences: {
        quietHours: {
          enabled: true,
          start: '00:00',
          end: '23:59',
          timezone: 'UTC',
        },
      },
    });

    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.PLAN_READY,
      title: 'Plan ready',
      body: 'Your plan is ready',
      data: { date: '2026-06-26' },
    });

    expect(result.notification).toBeTruthy();
    expect(result.push.sent).toBe(false);
    expect(result.push.reason).toBe('quiet_hours');
  });

  it('enforces the daily push cap', async () => {
    const user = await createTestUser({
      name: 'Capped',
      email: 'cap@test.com',
      passwordHash: 'hash',
      role: 'student',
      expoPushToken: 'ExponentPushToken[test]',
      pushNotificationsEnabled: true,
      notificationPreferences: {
        dailyPushCap: 1,
        quietHours: { enabled: false },
      },
    });

    await Notification.create({
      userId: user._id,
      type: NOTIFICATION_TYPES.RANK_UP,
      title: 'Earlier',
      body: 'Already sent',
      pushSent: true,
      createdAt: new Date(),
    });

    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.MOCK_LIVE,
      title: 'Mock live',
      body: 'A mock is live',
      data: { seriesId: 'abc' },
    });

    expect(result.notification).toBeTruthy();
    expect(result.push.sent).toBe(false);
    expect(result.push.reason).toBe('daily_cap_reached');
  });

  it('adds deep link metadata to stored notifications', async () => {
    const user = await createTestUser({
      name: 'Deep Link',
      email: 'deeplink@test.com',
      passwordHash: 'hash',
      role: 'student',
      pushNotificationsEnabled: false,
    });

    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.PLAN_READY,
      title: 'Plan ready',
      body: 'Sessions scheduled',
      data: { date: '2026-06-26' },
      channels: ['in_app'],
    });

    expect(result.notification.data.screen).toBe('StudyPlanner');
    expect(result.notification.data.params).toEqual({ date: '2026-06-26' });
  });
});

describe('quiet hours helper', () => {
  it('detects overnight quiet windows', () => {
    const quietHours = { enabled: true, start: '22:00', end: '07:00', timezone: 'UTC' };
    const lateNight = new Date('2026-06-26T23:00:00Z');
    const morning = new Date('2026-06-26T10:00:00Z');

    expect(isWithinQuietHours(quietHours, lateNight)).toBe(true);
    expect(isWithinQuietHours(quietHours, morning)).toBe(false);
  });

  it('merges legacy current affairs preference', () => {
    const prefs = resolveNotificationPreferences({
      pushNotificationsEnabled: true,
      currentAffairsAlertsEnabled: true,
      notificationPreferences: {},
    });

    expect(prefs.types.new_current_affairs).toBe(true);
  });
});

import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import { LiveClass } from '../src/models/LiveClass.js';
import { LiveClassReminder } from '../src/models/LiveClassReminder.js';
import { Notification } from '../src/models/Notification.js';
import {
  createLiveClass,
  createLiveToken,
  createViewerToken,
  endLiveClass,
  listLiveClasses,
  setLiveClassReminder,
  setRecordingPublished,
  startLiveClass,
} from '../src/services/liveClassService.js';
import * as livekit from '../src/services/livekit.js';
import {
  resetStreamingProviderForTests,
  setStreamingProviderForTests,
} from '../src/services/streaming/index.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

const mockProvider = {
  id: 'mock',
  isConfigured: () => true,
  getConnectionUrl: () => 'wss://mock.livekit.cloud',
  createRoom: async ({ roomName }) => ({ roomName, provider: 'mock' }),
  createViewerToken: async ({ roomName, identity, name }) => ({
    token: 'mock-student-token',
    url: 'wss://mock.livekit.cloud',
    provider: 'mock',
    roomName,
    identity,
    name,
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
    role: 'student',
  }),
  createHostToken: async ({ roomName, identity, name }) => ({
    token: 'mock-host-token',
    url: 'wss://mock.livekit.cloud',
    provider: 'mock',
    roomName,
    identity,
    name,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    role: 'host',
  }),
  getParticipantCount: async () => 42,
  startRecording: async () => ({
    egressId: 'egress-mock-1',
    recordingStatus: 'pending',
  }),
  stopRecording: async ({ roomName }) => ({
    recordingUrl: `https://recordings.example.com/${roomName}.mp4`,
    recordingStatus: 'ready',
  }),
};

async function loginUser(overrides = {}) {
  const user = await createTestUser({
    email: `live-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'Password123!',
    ...overrides,
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123!' })
    .expect(200);

  return { user, token: login.body.token };
}

describe('live classes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    resetStreamingProviderForTests();
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    resetStreamingProviderForTests();
    setStreamingProviderForTests(mockProvider);
    await clearTestDatabase();
  });

  it('lists classes with streaming configured flag', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-live@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    await createLiveClass(admin._id, {
      title: 'SSC CGL Quant Speed Tricks',
      instructor: 'Amit Sir',
      exam: 'SSC-CGL',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMin: 60,
    });

    const result = await listLiveClasses();

    expect(result.streamingConfigured).toBe(true);
    expect(result.comingSoon).toBe(false);
    expect(result.scheduled).toHaveLength(1);
    expect(result.scheduled[0]?.roomName).toMatch(/ssc-cgl-quant-speed-tricks-/);
  });

  it('issues viewer tokens for live classes and tracks attendee count', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-live2@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const student = await createTestUser({
      name: 'Student',
      email: 'student-live@test.com',
      passwordHash: 'hash',
      role: 'student',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const created = await createLiveClass(admin._id, {
      title: 'Live: Current Affairs Rapid Fire',
      instructor: 'Faculty',
      exam: 'General',
      startsAt: new Date(),
      durationMin: 40,
    });

    await startLiveClass(admin._id, created.id);

    const token = await createViewerToken(student._id, created.id);

    expect(token.token).toBe('mock-student-token');
    expect(token.canPublish).toBe(false);
    expect(token.canSubscribe).toBe(true);
    expect(token.canPublishData).toBe(true);
    expect(token.url).toContain('wss://');
    expect(token.attendeeCount).toBe(42);
  });

  it('requires Pro for free students joining a live class', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-live-pro@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const freeStudent = await createTestUser({
      name: 'Free Student',
      email: 'student-live-free@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const created = await createLiveClass(admin._id, {
      title: 'Pro-only Live',
      instructor: 'Faculty',
      exam: 'General',
      startsAt: new Date(),
      durationMin: 40,
    });
    await startLiveClass(admin._id, created.id);

    await expect(createViewerToken(freeStudent._id, created.id)).rejects.toMatchObject({
      code: 'PRO_REQUIRED',
      statusCode: 403,
    });
  });

  it('issues host tokens for the class educator', async () => {
    const mentor = await createTestUser({
      name: 'Mentor',
      email: 'mentor-live@test.com',
      passwordHash: 'hash',
      role: 'creator',
    });
    const student = await createTestUser({
      name: 'Student',
      email: 'student-live3@test.com',
      passwordHash: 'hash',
      role: 'student',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const created = await createLiveClass(mentor._id, {
      title: 'Host Token Class',
      instructor: 'Mentor',
      exam: 'SSC',
      startsAt: new Date(),
      durationMin: 45,
    });

    await startLiveClass(mentor._id, created.id);

    const hostToken = await createLiveToken(mentor._id, created.id);
    const viewerToken = await createLiveToken(student._id, created.id);

    expect(hostToken.role).toBe('host');
    expect(hostToken.canPublish).toBe(true);
    expect(hostToken.token).toBe('mock-host-token');
    expect(viewerToken.role).toBe('student');
    expect(viewerToken.canPublish).toBe(false);
    expect(viewerToken.token).toBe('mock-student-token');
  });

  it('does not issue tokens for scheduled or ended classes', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-live-guard@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const student = await createTestUser({
      name: 'Student',
      email: 'student-live-guard@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const scheduled = await createLiveClass(admin._id, {
      title: 'Future Class',
      exam: 'SSC',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMin: 60,
    });

    const scheduledToken = await createLiveToken(student._id, scheduled.id);
    expect(scheduledToken.token).toBeNull();
    expect(scheduledToken.status).toBe('scheduled');

    const live = await createLiveClass(admin._id, {
      title: 'Ended Class',
      exam: 'SSC',
      startsAt: new Date(),
      durationMin: 60,
    });
    await startLiveClass(admin._id, live.id);
    await endLiveClass(admin._id, live.id);

    const endedToken = await createLiveToken(student._id, live.id);
    expect(endedToken.token).toBeNull();
    expect(endedToken.status).toBe('ended');
  });

  it('stores recordingUrl when a live class ends', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-live3@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const created = await createLiveClass(admin._id, {
      title: 'Recorded Session',
      instructor: 'Faculty',
      exam: 'Banking',
      startsAt: new Date(),
      durationMin: 50,
      autoRecord: true,
    });

    await startLiveClass(admin._id, created.id);
    const ended = await endLiveClass(admin._id, created.id);

    expect(ended.status).toBe('ended');
    expect(ended.recordingUrl).toContain('https://recordings.example.com/');
    expect(ended.recordingStatus).toBe('ready');
    expect(ended.egressId).toBe('egress-mock-1');

    await setRecordingPublished(admin._id, created.id, true);

    const listed = await listLiveClasses();
    expect(listed.recorded).toHaveLength(1);
    expect(listed.recorded[0]?.id).toBe(created.id);
  });

  it('stores reminders for scheduled classes', async () => {
    const student = await createTestUser({
      name: 'Student',
      email: 'student-reminder@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const liveClass = await LiveClass.create({
      title: 'Banking Awareness Marathon',
      instructor: 'Neha',
      exam: 'IBPS-PO',
      startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      durationMin: 45,
      roomName: 'banking-test-room',
      status: 'scheduled',
    });

    const reminder = await setLiveClassReminder(student._id, liveClass._id.toString());
    expect(reminder.reminderSet).toBe(true);

    const listed = await listLiveClasses(student._id);
    expect(listed.scheduled[0]?.reminderSet).toBe(true);
    expect(await LiveClassReminder.countDocuments()).toBe(1);
  });

  it('mints LiveKit JWT grants for host vs student roles', async () => {
    const host = await livekit.mintRoomToken({
      identity: 'host-user',
      name: 'Host',
      roomName: 'room-1',
      role: 'host',
    });

    const student = await livekit.mintRoomToken({
      identity: 'student-user',
      name: 'Student',
      roomName: 'room-1',
      role: 'student',
    });

    const hostClaims = jwt.decode(host.token);
    const studentClaims = jwt.decode(student.token);

    expect(hostClaims.video.canPublish).toBe(true);
    expect(studentClaims.video.canPublish).toBe(false);
    expect(studentClaims.video.canSubscribe).toBe(true);
    expect(studentClaims.video.canPublishData).toBe(true);
  });

  it('admin can create, start, end, and filter live classes via HTTP', async () => {
    await createTestUser({
      email: 'notify-student@test.com',
      password: 'Password123!',
      role: 'student',
    });

    const { token } = await loginUser({ role: 'admin', email: `admin-http-${Date.now()}@test.com` });

    const created = await request(app)
      .post('/api/admin/live-classes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin HTTP Live Class',
        exam: 'SSC-CGL',
        topic: 'Algebra',
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        durationMin: 60,
        autoRecord: true,
        notify: true,
      })
      .expect(201);

    expect(created.body.status).toBe('scheduled');
    expect(created.body.roomName).toMatch(/admin-http-live-class-/);
    expect(created.body.exam).toBe('SSC-CGL');

    const notifications = await Notification.countDocuments({ type: 'live_class_scheduled' });
    expect(notifications).toBeGreaterThan(0);

    const started = await request(app)
      .post(`/api/admin/live-classes/${created.body.id}/start`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(started.body.status).toBe('live');
    expect(started.body.egressId).toBe('egress-mock-1');

    const { token: studentToken } = await loginUser({
      role: 'student',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const liveToken = await request(app)
      .get(`/api/live/${created.body.id}/token`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(liveToken.body.token).toBe('mock-student-token');
    expect(liveToken.body.canPublish).toBe(false);

    const ended = await request(app)
      .post(`/api/admin/live-classes/${created.body.id}/end`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(ended.body.status).toBe('ended');
    expect(ended.body.recordingUrl).toContain('https://recordings.example.com/');

    const published = await request(app)
      .patch(`/api/admin/live-classes/${created.body.id}/recording`)
      .set('Authorization', `Bearer ${token}`)
      .send({ published: true })
      .expect(200);

    expect(published.body.recordingPublished).toBe(true);

    const noToken = await request(app)
      .get(`/api/live/${created.body.id}/token`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(noToken.body.token).toBeNull();
    expect(noToken.body.status).toBe('ended');

    const filtered = await request(app)
      .get('/api/admin/live-classes?status=ended')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0].id).toBe(created.body.id);
  });
});

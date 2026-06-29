import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { LiveClass } from '../src/models/LiveClass.js';
import { LiveClassReminder } from '../src/models/LiveClassReminder.js';
import {
  createLiveClass,
  createLiveToken,
  createViewerToken,
  listLiveClasses,
  setLiveClassReminder,
  updateLiveClassStatus,
} from '../src/services/liveClassService.js';
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
    token: 'mock-token',
    url: 'wss://mock.livekit.cloud',
    provider: 'mock',
    roomName,
    identity,
    name,
  }),
  createHostToken: async () => ({ token: 'host-token', url: 'wss://mock.livekit.cloud', provider: 'mock', role: 'host' }),
  getParticipantCount: async () => 42,
  finalizeRecording: async ({ roomName }) => ({
    recordingUrl: `https://recordings.example.com/${roomName}.mp4`,
    recordingStatus: 'ready',
  }),
};

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
      examTag: 'SSC-CGL',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMin: 60,
    });

    const result = await listLiveClasses();

    expect(result.streamingConfigured).toBe(true);
    expect(result.comingSoon).toBe(false);
    expect(result.scheduled).toHaveLength(1);
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
    });

    const created = await createLiveClass(admin._id, {
      title: 'Live: Current Affairs Rapid Fire',
      instructor: 'Faculty',
      examTag: 'General',
      scheduledAt: new Date(),
      durationMin: 40,
      status: 'live',
    });

    await updateLiveClassStatus(admin._id, created.id, 'live');

    const token = await createViewerToken(student._id, created.id);

    expect(token.token).toBe('mock-token');
    expect(token.url).toContain('wss://');
    expect(token.attendeeCount).toBe(42);
  });

  it('issues host tokens for the class educator', async () => {
    const mentor = await createTestUser({
      name: 'Mentor',
      email: 'mentor-live@test.com',
      passwordHash: 'hash',
      role: 'mentor',
    });
    const student = await createTestUser({
      name: 'Student',
      email: 'student-live3@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const created = await createLiveClass(mentor._id, {
      title: 'Host Token Class',
      instructor: 'Mentor',
      examTag: 'SSC',
      scheduledAt: new Date(),
      durationMin: 45,
      status: 'live',
    });

    const hostToken = await createLiveToken(mentor._id, created.id);
    const viewerToken = await createLiveToken(student._id, created.id);

    expect(hostToken.role).toBe('host');
    expect(hostToken.token).toBe('host-token');
    expect(viewerToken.role).toBe('viewer');
    expect(viewerToken.token).toBe('mock-token');
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
      examTag: 'Banking',
      scheduledAt: new Date(),
      durationMin: 50,
      status: 'live',
    });

    const ended = await updateLiveClassStatus(admin._id, created.id, 'ended');

    expect(ended.status).toBe('ended');
    expect(ended.recordingUrl).toContain('https://recordings.example.com/');
    expect(ended.recordingStatus).toBe('ready');

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
      examTag: 'IBPS-PO',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      durationMin: 45,
      streamingRoomId: 'sopaan-banking-test',
      status: 'scheduled',
    });

    const reminder = await setLiveClassReminder(student._id, liveClass._id.toString());
    expect(reminder.reminderSet).toBe(true);

    const listed = await listLiveClasses(student._id);
    expect(listed.scheduled[0]?.reminderSet).toBe(true);
    expect(await LiveClassReminder.countDocuments()).toBe(1);
  });
});

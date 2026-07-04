import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { LiveClass } from '../src/models/LiveClass.js';
import { startRealtimeTestServer, stopRealtimeTestServer } from './helpers/realtime.js';
import { LIVE_NS_EVENTS } from '../src/realtime/liveEvents.js';
import { ADMIN_NS_EVENTS } from '../src/realtime/adminEvents.js';
import { resetLiveChatStoreForTests } from '../src/realtime/liveChatStore.js';
import { resetLiveNamespaceStateForTests } from '../src/realtime/liveNamespace.js';
import { resetChatModerationForTests } from '../src/realtime/moderation.js';
import { processEgressEnded } from '../src/services/liveEgressWebhookService.js';
import {
  resetStreamingProviderForTests,
  setStreamingProviderForTests,
} from '../src/services/streaming/index.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { nextTestPhoneE164 } from './helpers/privacy.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';

const mockProvider = {
  id: 'mock',
  isConfigured: () => true,
  getConnectionUrl: () => 'wss://mock.livekit.cloud',
  createRoom: async ({ roomName }) => ({ roomName, provider: 'mock' }),
  createViewerToken: async () => ({
    token: 'viewer-token',
    url: 'wss://mock.livekit.cloud',
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
    role: 'student',
  }),
  createHostToken: async () => ({
    token: 'host-token',
    url: 'wss://mock.livekit.cloud',
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    role: 'host',
  }),
  getParticipantCount: async () => 2,
  startRecording: async () => ({ egressId: 'egress-smoke-1', recordingStatus: 'pending' }),
  stopRecording: async () => ({ recordingStatus: 'pending' }),
};

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: '1h',
  });
}

describe('live class smoke flow', () => {
  let httpServer;
  let port;
  let adminUser;
  let studentUser;
  let adminToken;
  const sockets = [];

  beforeAll(async () => {
    await setupTestDatabase();
    ({ httpServer, port } = await startRealtimeTestServer());
  });

  afterAll(async () => {
    await stopRealtimeTestServer(httpServer);
    resetStreamingProviderForTests();
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    resetStreamingProviderForTests();
    setStreamingProviderForTests(mockProvider);
    await clearTestDatabase();
    resetLiveChatStoreForTests();
    resetLiveNamespaceStateForTests();
    resetChatModerationForTests();

    const seed = getSeedAdminUser();
    const adminEmail = `admin-smoke-${Date.now()}@test.com`;

    adminUser = await createTestUser({
      name: seed.name,
      email: adminEmail,
      phone: nextTestPhoneE164(),
      role: 'admin',
      password: seed.password,
    });

    studentUser = await createTestUser({
      email: `smoke-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Smoke Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: seed.password })
      .expect(200);

    adminToken = login.body.token;
  });

  afterEach(() => {
    for (const socket of sockets.splice(0)) {
      socket.disconnect();
    }
  });

  function trackSocket(socket) {
    sockets.push(socket);
    return socket;
  }

  function connectLiveClient(user) {
    return trackSocket(
      Client(`http://127.0.0.1:${port}/live`, {
        path: '/socket.io',
        transports: ['websocket'],
        auth: { token: signToken(user) },
        forceNew: true,
      }),
    );
  }

  function connectAdminClient(user) {
    return trackSocket(
      Client(`http://127.0.0.1:${port}/admin`, {
        path: '/socket.io',
        transports: ['websocket'],
        auth: { token: signToken(user) },
        forceNew: true,
      }),
    );
  }

  async function waitForPresence(socket, classId, minCount = 2) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('presence timeout')), 8000);
      const handler = (payload) => {
        if (payload.classId === classId && payload.count >= minCount) {
          clearTimeout(timer);
          socket.off(LIVE_NS_EVENTS.PRESENCE, handler);
          resolve(payload);
        }
      };
      socket.on(LIVE_NS_EVENTS.PRESENCE, handler);
    });
  }

  it('schedules → starts → chats → ends → records a class', async () => {
    const scheduled = await request(app)
      .post('/api/admin/live-classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Smoke Live Class',
        exam: 'SSC-CGL',
        topic: 'Math',
        startsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        durationMin: 60,
        autoRecord: true,
      })
      .expect(201);

    const classId = scheduled.body.id;
    expect(scheduled.body.status).toBe('scheduled');

    const started = await request(app)
      .post(`/api/admin/live-classes/${classId}/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(started.body.status).toBe('live');
    expect(started.body.egressId).toBe('egress-smoke-1');

    const hostSocket = connectLiveClient(adminUser);
    const studentSocket = connectLiveClient(studentUser);

    await Promise.all([
      new Promise((resolve, reject) => {
        hostSocket.once('connect', resolve);
        hostSocket.once('connect_error', reject);
      }),
      new Promise((resolve, reject) => {
        studentSocket.once('connect', resolve);
        studentSocket.once('connect_error', reject);
      }),
    ]);

    hostSocket.emit(LIVE_NS_EVENTS.JOIN, { classId });
    studentSocket.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(hostSocket, classId, 2);

    const chatReceived = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('chat timeout')), 8000);
      studentSocket.once(LIVE_NS_EVENTS.CHAT_MESSAGE, (message) => {
        clearTimeout(timer);
        resolve(message);
      });
    });

    hostSocket.emit(LIVE_NS_EVENTS.CHAT_MESSAGE, {
      classId,
      text: 'Hello class',
    });

    const message = await chatReceived;
    expect(message.text).toBe('Hello class');

    const ended = await request(app)
      .post(`/api/admin/live-classes/${classId}/end`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(ended.body.status).toBe('ended');

    const liveClass = await LiveClass.findById(classId).lean();
    const recordingUrl = 'https://cdn.example.com/recordings/smoke.mp4';

    await processEgressEnded({
      egressId: liveClass.egressId,
      roomName: liveClass.roomName,
      fileResults: [{ location: recordingUrl, duration: 1_800_000_000_000 }],
    });

    const refreshed = await LiveClass.findById(classId).lean();
    expect(refreshed.recordingUrl).toBe(recordingUrl);
    expect(refreshed.recordingStatus).toBe('ready');

    await request(app)
      .patch(`/api/admin/live-classes/${classId}/recording`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ published: true })
      .expect(200);

    const listed = await request(app)
      .get('/api/admin/live-classes?status=ended')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const row = listed.body.items.find((item) => item.id === classId);
    expect(row.recordingPublished).toBe(true);
  });

  it('pushes dashboard counters over the admin socket namespace', async () => {
    const adminSocket = connectAdminClient(adminUser);

    const counters = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('admin counters timeout')), 8000);
      adminSocket.once('connect', () => {
        adminSocket.once(ADMIN_NS_EVENTS.COUNTERS, (payload) => {
          clearTimeout(timer);
          resolve(payload);
        });
      });
      adminSocket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    expect(counters).toMatchObject({
      pendingReviews: expect.any(Number),
      pendingQuestionReviews: expect.any(Number),
      liveClasses: expect.any(Number),
    });
  });
});

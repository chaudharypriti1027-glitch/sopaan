import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import request from 'supertest';
import app from '../src/app.js';
import { LiveClass } from '../src/models/LiveClass.js';
import {
  createLiveClass,
  endLiveClass,
  listLiveClasses,
  setRecordingPublished,
  startLiveClass,
} from '../src/services/liveClassService.js';
import { processEgressEnded } from '../src/services/liveEgressWebhookService.js';
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
  createViewerToken: async () => ({
    token: 'mock-student-token',
    url: 'wss://mock.livekit.cloud',
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
    role: 'student',
  }),
  createHostToken: async () => ({
    token: 'mock-host-token',
    url: 'wss://mock.livekit.cloud',
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    role: 'host',
  }),
  getParticipantCount: async () => 12,
  startRecording: async () => ({
    egressId: 'egress-webhook-test',
    recordingStatus: 'pending',
  }),
  stopRecording: async () => ({
    recordingStatus: 'pending',
  }),
};

describe('live egress webhook', () => {
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

  it('finalizes recordingUrl from egress_ended webhook payload', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-egress@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const created = await createLiveClass(admin._id, {
      title: 'Webhook Recording Class',
      exam: 'SSC',
      startsAt: new Date(),
      durationMin: 45,
      autoRecord: true,
    });

    await startLiveClass(admin._id, created.id);
    const ended = await endLiveClass(admin._id, created.id);

    expect(ended.recordingStatus).toBe('pending');
    expect(ended.recordingUrl).toBeNull();

    const recordingUrl = 'https://cdn.example.com/live-classes/class.mp4';
    const result = await processEgressEnded({
      egressId: 'egress-webhook-test',
      roomName: created.roomName,
      fileResults: [
        {
          filename: `live-classes/${created.id}/${created.roomName}.mp4`,
          location: recordingUrl,
          duration: 3_600_000_000_000,
        },
      ],
    });

    expect(result.matched).toBe(true);
    expect(result.recordingUrl).toBe(recordingUrl);

    const doc = await LiveClass.findById(created.id).lean();
    expect(doc?.recordingUrl).toBe(recordingUrl);
    expect(doc?.recordingStatus).toBe('ready');
    expect(doc?.recordingDurationSec).toBe(3600);
    expect(doc?.status).toBe('ended');
  });

  it('accepts POST /api/live/egress-webhook with a valid LiveKit signature', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-egress-http@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const created = await createLiveClass(admin._id, {
      title: 'HTTP Webhook Class',
      exam: 'Banking',
      startsAt: new Date(),
      durationMin: 30,
      autoRecord: true,
    });

    await startLiveClass(admin._id, created.id);
    await endLiveClass(admin._id, created.id);

    const body = JSON.stringify({
      event: 'egress_ended',
      egressInfo: {
        egressId: 'egress-webhook-test',
        roomName: created.roomName,
        fileResults: [
          {
            location: 'https://cdn.example.com/recordings/http-class.mp4',
            duration: 1_800_000_000_000,
          },
        ],
      },
    });

    const sha256 = crypto.createHash('sha256').update(body).digest('base64');
    const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    token.sha256 = sha256;
    const authHeader = await token.toJwt();

    const response = await request(app)
      .post('/api/live/egress-webhook')
      .set('Authorization', authHeader)
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(200);

    expect(response.body.matched).toBe(true);
    expect(response.body.recordingUrl).toContain('http-class.mp4');
  });

  it('only lists published recordings for students', async () => {
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-publish@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    const created = await createLiveClass(admin._id, {
      title: 'Publish Gate Class',
      exam: 'SSC',
      startsAt: new Date(),
      durationMin: 40,
      autoRecord: true,
    });

    await startLiveClass(admin._id, created.id);
    await endLiveClass(admin._id, created.id);

    await processEgressEnded({
      egressId: 'egress-webhook-test',
      roomName: created.roomName,
      fileResults: [
        {
          location: 'https://cdn.example.com/recordings/publish-gate.mp4',
          duration: 2_400_000_000_000,
        },
      ],
    });

    const hidden = await listLiveClasses();
    expect(hidden.recorded).toHaveLength(0);

    await setRecordingPublished(admin._id, created.id, true);

    const visible = await listLiveClasses();
    expect(visible.recorded).toHaveLength(1);
    expect(visible.recorded[0]?.id).toBe(created.id);
    expect(visible.recorded[0]?.recordingUrl).toContain('publish-gate.mp4');
  });
});

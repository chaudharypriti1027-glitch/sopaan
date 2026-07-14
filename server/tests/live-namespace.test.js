import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { LiveClass } from '../src/models/LiveClass.js';
import {
  startRealtimeTestServer,
  stopRealtimeTestServer,
  waitForPresence,
  waitForSocketConnect,
} from './helpers/realtime.js';
import { LIVE_NS_EVENTS } from '../src/realtime/liveEvents.js';
import { resetLiveChatStoreForTests } from '../src/realtime/liveChatStore.js';
import { resetLiveNamespaceStateForTests } from '../src/realtime/liveNamespace.js';
import { resetChatModerationForTests } from '../src/realtime/moderation.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: '1h',
  });
}

describe('/live socket namespace', () => {
  jest.setTimeout(45_000);
  let httpServer;
  let port;
  let hostUser;
  let studentUser;
  let liveClass;

  beforeAll(async () => {
    await setupTestDatabase();
    ({ httpServer, port } = await startRealtimeTestServer());
  });

  afterAll(async () => {
    await stopRealtimeTestServer(httpServer);
    await teardownTestDatabase();
  }, 45_000);

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });

  beforeEach(async () => {
    await clearTestDatabase();
    resetLiveChatStoreForTests();
    resetLiveNamespaceStateForTests();
    resetChatModerationForTests();

    hostUser = await createTestUser({
      email: `host-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
      name: 'Host Admin',
    });

    studentUser = await createTestUser({
      email: `student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Student One',
    });

    liveClass = await LiveClass.create({
      title: 'Socket Live Class',
      instructor: 'Host Admin',
      educatorId: hostUser._id,
      exam: 'SSC',
      startsAt: new Date(),
      durationMin: 60,
      roomName: `socket-live-${Date.now()}`,
      status: 'live',
      startedAt: new Date(),
    });
  });

  function connectClient(user) {
    return Client(`http://127.0.0.1:${port}/live`, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: signToken(user) },
    });
  }

  async function connectPair() {
    const host = connectClient(hostUser);
    const student = connectClient(studentUser);
    await Promise.all([waitForSocketConnect(host), waitForSocketConnect(student)]);
    return { host, student };
  }

  it('broadcasts chat messages and presence between host and students', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();

    const hostPresence = waitForPresence(host, classId, 2);

    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });

    await hostPresence;

    const studentMessage = new Promise((resolve) => {
      host.once(LIVE_NS_EVENTS.CHAT_MESSAGE, resolve);
    });

    student.emit(LIVE_NS_EVENTS.CHAT_MESSAGE, {
      classId: liveClass._id.toString(),
      text: 'Hello from student',
    });

    const message = await studentMessage;
    expect(message.text).toBe('Hello from student');
    expect(message.userName).toBe('Student One');
    expect(message.isHost).toBe(false);

    const hostMessage = new Promise((resolve) => {
      const handler = (payload) => {
        if (payload.text === 'Welcome everyone') {
          student.off(LIVE_NS_EVENTS.CHAT_MESSAGE, handler);
          resolve(payload);
        }
      };
      student.on(LIVE_NS_EVENTS.CHAT_MESSAGE, handler);
    });

    host.emit(LIVE_NS_EVENTS.CHAT_MESSAGE, {
      classId: liveClass._id.toString(),
      text: 'Welcome everyone',
    });

    const reply = await hostMessage;
    expect(reply.text).toBe('Welcome everyone');
    expect(reply.isHost).toBe(true);

    host.disconnect();
    student.disconnect();
  });

  it('broadcasts reactions and notifies host on hand raise', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();

    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const reactionPromise = new Promise((resolve) => {
      host.once(LIVE_NS_EVENTS.REACTION, resolve);
    });

    student.emit(LIVE_NS_EVENTS.REACTION, {
      classId: liveClass._id.toString(),
      emoji: '👍',
    });

    const reaction = await reactionPromise;
    expect(reaction.emoji).toBe('👍');

    const handPromise = new Promise((resolve) => {
      host.on(LIVE_NS_EVENTS.HAND_NOTIFY, resolve);
    });

    student.emit(LIVE_NS_EVENTS.HAND_RAISE, { classId: liveClass._id.toString() });

    const hand = await handPromise;
    expect(hand.raised).toBe(true);
    expect(hand.userName).toBe('Student One');

    host.disconnect();
    student.disconnect();
  });

  it('forwards host mute-all to students', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();

    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const mutePromise = new Promise((resolve) => {
      student.once(LIVE_NS_EVENTS.HOST_MUTE_ALL, resolve);
    });

    host.emit(LIVE_NS_EVENTS.HOST_MUTE_ALL, { classId: liveClass._id.toString() });

    const payload = await mutePromise;
    expect(payload.classId).toBe(liveClass._id.toString());

    host.disconnect();
    student.disconnect();
  });

  it('relays dev stream requests from students to host', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();

    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const requestPromise = new Promise((resolve) => {
      host.once(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, resolve);
    });

    student.emit(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, { classId });

    const request = await requestPromise;
    expect(request.userId).toBe(studentUser._id.toString());

    host.disconnect();
    student.disconnect();
  });

  it('relays dev stream signals between host and student', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();

    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const offer = { type: 'offer', sdp: 'v=0' };
    const signalPromise = new Promise((resolve) => {
      student.once(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, resolve);
    });

    host.emit(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, {
      classId,
      toUserId: studentUser._id.toString(),
      type: 'offer',
      data: offer,
    });

    const signal = await signalPromise;
    expect(signal.type).toBe('offer');
    expect(signal.fromUserId).toBe(hostUser._id.toString());

    host.disconnect();
    student.disconnect();
  });

  it('persists host announcements for late joiners', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();
    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    host.emit(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, {
      classId,
      message: 'Formula: Work = Rate × Time',
    });

    const lateStudent = connectClient(studentUser);
    await waitForSocketConnect(lateStudent);

    const announcementPromise = new Promise((resolve) => {
      lateStudent.once(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, resolve);
    });

    lateStudent.emit(LIVE_NS_EVENTS.JOIN, { classId });

    const announcement = await announcementPromise;
    expect(announcement.message).toBe('Formula: Work = Rate × Time');

    host.disconnect();
    student.disconnect();
    lateStudent.disconnect();
  });

  it('acks hand raise to the student', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();
    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const ackPromise = new Promise((resolve) => {
      student.once(LIVE_NS_EVENTS.HAND_ACK, resolve);
    });

    student.emit(LIVE_NS_EVENTS.HAND_RAISE, { classId });

    const ack = await ackPromise;
    expect(ack.raised).toBe(true);
    expect(ack.message).toMatch(/raised your hand/i);

    host.disconnect();
    student.disconnect();
  });

  it('accepts heart reaction emoji', async () => {
    const { host, student } = await connectPair();

    const classId = liveClass._id.toString();
    host.emit(LIVE_NS_EVENTS.JOIN, { classId });
    student.emit(LIVE_NS_EVENTS.JOIN, { classId });
    await waitForPresence(host, classId, 2);

    const reactionPromise = new Promise((resolve) => {
      host.once(LIVE_NS_EVENTS.REACTION, resolve);
    });

    student.emit(LIVE_NS_EVENTS.REACTION, { classId, emoji: '❤️' });

    const reaction = await reactionPromise;
    expect(reaction.emoji).toBe('❤️');

    host.disconnect();
    student.disconnect();
  });
});

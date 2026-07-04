import { LiveClass } from '../models/LiveClass.js';
import { isAdminRole, normalizeUserRole } from '../constants/userRoles.js';
import { appendLiveChatMessage, getLiveChatHistory } from './liveChatStore.js';
import { LIVE_NS_EVENTS, LIVE_REACTION_EMOJIS } from './liveEvents.js';
import { checkChatRateLimit, sanitizeChatMessage } from './moderation.js';

const raisedHandsByClass = new Map();

function classRaisedHands(classId) {
  if (!raisedHandsByClass.has(classId)) {
    raisedHandsByClass.set(classId, new Map());
  }

  return raisedHandsByClass.get(classId);
}

async function assertLiveClassAccess(classId) {
  const liveClass = await LiveClass.findById(classId).select('status title educatorId instructorId createdBy').lean();

  if (!liveClass) {
    return { ok: false, code: 'NOT_FOUND', message: 'Live class not found' };
  }

  if (liveClass.status !== 'live') {
    return { ok: false, code: 'NOT_LIVE', message: 'This class is not live' };
  }

  return { ok: true, liveClass };
}

async function resolveIsHost(userId, userRole, liveClass) {
  if (isAdminRole(userRole)) {
    return true;
  }

  const educatorId = liveClass.educatorId ?? liveClass.instructorId;

  if (educatorId && educatorId.toString() === userId) {
    return true;
  }

  if (
    liveClass.createdBy &&
    liveClass.createdBy.toString() === userId &&
    ['admin', 'creator'].includes(normalizeUserRole(userRole))
  ) {
    return true;
  }

  return false;
}

function presencePayload(liveNs, classId) {
  const room = liveNs.adapter.rooms.get(classId);
  const socketIds = room ? [...room] : [];

  const participants = socketIds
    .map((socketId) => {
      const sock = liveNs.sockets.get(socketId);
      if (!sock?.user) {
        return null;
      }

      return {
        userId: sock.user.id,
        name: sock.user.name,
        isHost: Boolean(sock.data.isLiveHost),
      };
    })
    .filter(Boolean);

  const raisedHands = [...classRaisedHands(classId).entries()].map(([userId, info]) => ({
    userId,
    userName: info.userName,
    raisedAt: info.raisedAt,
  }));

  return {
    classId,
    count: participants.length,
    participants,
    raisedHands,
  };
}

function broadcastPresence(liveNs, classId) {
  liveNs.to(classId).emit(LIVE_NS_EVENTS.PRESENCE, presencePayload(liveNs, classId));
}

function emitToHosts(liveNs, classId, event, payload) {
  for (const sock of liveNs.sockets.values()) {
    if (sock.rooms.has(classId) && sock.data.isLiveHost) {
      sock.emit(event, payload);
    }
  }
}

function emitToUser(liveNs, classId, userId, event, payload) {
  for (const sock of liveNs.sockets.values()) {
    if (sock.rooms.has(classId) && sock.user.id === userId) {
      sock.emit(event, payload);
      return true;
    }
  }

  return false;
}

function emitError(socket, classId, code, message) {
  socket.emit(LIVE_NS_EVENTS.ERROR, { classId, code, message });
}

export function registerLiveNamespace(liveNs) {
  liveNs.on('connection', (socket) => {
    socket.data.liveClassId = null;
    socket.data.isLiveHost = false;

    socket.on(LIVE_NS_EVENTS.JOIN, async ({ classId } = {}) => {
      if (!classId) {
        emitError(socket, null, 'INVALID_REQUEST', 'classId is required');
        return;
      }

      const access = await assertLiveClassAccess(classId);

      if (!access.ok) {
        emitError(socket, classId, access.code, access.message);
        return;
      }

      if (socket.data.liveClassId && socket.data.liveClassId !== classId) {
        await socket.leave(socket.data.liveClassId);
      }

      socket.data.isLiveHost = await resolveIsHost(
        socket.user.id,
        socket.user.role,
        access.liveClass,
      );

      await socket.join(classId);
      socket.data.liveClassId = classId;

      const history = await getLiveChatHistory(classId);
      socket.emit(LIVE_NS_EVENTS.CHAT_HISTORY, { classId, messages: history });
      broadcastPresence(liveNs, classId);
    });

    socket.on(LIVE_NS_EVENTS.LEAVE, async ({ classId } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId) {
        return;
      }

      await socket.leave(roomId);
      classRaisedHands(roomId).delete(socket.user.id);
      socket.data.liveClassId = null;
      socket.data.isLiveHost = false;
      broadcastPresence(liveNs, roomId);
    });

    socket.on(LIVE_NS_EVENTS.CHAT_MESSAGE, async ({ classId, text } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId) {
        emitError(socket, null, 'NOT_JOINED', 'Join a class before sending messages');
        return;
      }

      const access = await assertLiveClassAccess(roomId);

      if (!access.ok) {
        emitError(socket, roomId, access.code, access.message);
        return;
      }

      const rate = checkChatRateLimit(socket.user.id);

      if (!rate.ok) {
        emitError(socket, roomId, rate.code, rate.message);
        return;
      }

      const sanitized = sanitizeChatMessage(text);

      if (!sanitized.ok) {
        emitError(socket, roomId, sanitized.code, sanitized.message);
        return;
      }

      const message = await appendLiveChatMessage(roomId, {
        id: `${Date.now()}-${socket.user.id}`,
        classId: roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        text: sanitized.text,
        createdAt: new Date().toISOString(),
      });

      liveNs.to(roomId).emit(LIVE_NS_EVENTS.CHAT_MESSAGE, message);
    });

    socket.on(LIVE_NS_EVENTS.REACTION, async ({ classId, emoji } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId || !emoji) {
        return;
      }

      const access = await assertLiveClassAccess(roomId);

      if (!access.ok) {
        emitError(socket, roomId, access.code, access.message);
        return;
      }

      if (!LIVE_REACTION_EMOJIS.includes(emoji)) {
        emitError(socket, roomId, 'INVALID_REACTION', 'Reaction not allowed');
        return;
      }

      liveNs.to(roomId).emit(LIVE_NS_EVENTS.REACTION, {
        classId: roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        emoji,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on(LIVE_NS_EVENTS.HAND_RAISE, async ({ classId } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId) {
        return;
      }

      const access = await assertLiveClassAccess(roomId);

      if (!access.ok) {
        emitError(socket, roomId, access.code, access.message);
        return;
      }

      classRaisedHands(roomId).set(socket.user.id, {
        userName: socket.user.name,
        raisedAt: new Date().toISOString(),
      });

      const payload = {
        classId: roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        raised: true,
        createdAt: new Date().toISOString(),
      };

      emitToHosts(liveNs, roomId, LIVE_NS_EVENTS.HAND_NOTIFY, payload);
      broadcastPresence(liveNs, roomId);
    });

    socket.on(LIVE_NS_EVENTS.HAND_LOWER, async ({ classId } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId) {
        return;
      }

      classRaisedHands(roomId).delete(socket.user.id);

      emitToHosts(liveNs, roomId, LIVE_NS_EVENTS.HAND_NOTIFY, {
        classId: roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        raised: false,
        createdAt: new Date().toISOString(),
      });

      broadcastPresence(liveNs, roomId);
    });

    socket.on(LIVE_NS_EVENTS.HOST_MUTE_ALL, async ({ classId } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId || !socket.data.isLiveHost) {
        emitError(socket, roomId, 'FORBIDDEN', 'Only the host can mute all students');
        return;
      }

      socket.to(roomId).emit(LIVE_NS_EVENTS.HOST_MUTE_ALL, {
        classId: roomId,
        at: new Date().toISOString(),
      });
    });

    socket.on(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, async ({ classId, message } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;
      const text = String(message ?? '').trim();

      if (!roomId || !socket.data.isLiveHost) {
        emitError(socket, roomId, 'FORBIDDEN', 'Only the host can send announcements');
        return;
      }

      if (!text) {
        emitError(socket, roomId, 'EMPTY_MESSAGE', 'Announcement cannot be empty');
        return;
      }

      socket.to(roomId).emit(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, {
        classId: roomId,
        message: text.slice(0, 500),
        at: new Date().toISOString(),
      });
    });

    socket.on(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, async ({ classId } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;

      if (!roomId) {
        emitError(socket, null, 'NOT_JOINED', 'Join a class before requesting the stream');
        return;
      }

      const access = await assertLiveClassAccess(roomId);

      if (!access.ok) {
        emitError(socket, roomId, access.code, access.message);
        return;
      }

      if (socket.data.isLiveHost) {
        return;
      }

      emitToHosts(liveNs, roomId, LIVE_NS_EVENTS.DEV_STREAM_REQUEST, {
        classId: roomId,
        userId: socket.user.id,
        userName: socket.user.name,
      });
    });

    socket.on(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, async ({ classId, toUserId, type, data } = {}) => {
      const roomId = classId ?? socket.data.liveClassId;
      const allowedTypes = new Set(['offer', 'answer', 'ice']);

      if (!roomId || !toUserId || !type || !data || !allowedTypes.has(type)) {
        emitError(socket, roomId, 'INVALID_REQUEST', 'Invalid dev stream signal');
        return;
      }

      const access = await assertLiveClassAccess(roomId);

      if (!access.ok) {
        emitError(socket, roomId, access.code, access.message);
        return;
      }

      if (type === 'offer' && !socket.data.isLiveHost) {
        emitError(socket, roomId, 'FORBIDDEN', 'Only the host can send stream offers');
        return;
      }

      if (type === 'answer' && socket.data.isLiveHost) {
        emitError(socket, roomId, 'FORBIDDEN', 'Host cannot answer viewer offers');
        return;
      }

      const payload = {
        classId: roomId,
        fromUserId: socket.user.id,
        type,
        data,
      };

      if (toUserId === 'host') {
        emitToHosts(liveNs, roomId, LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, payload);
        return;
      }

      if (!emitToUser(liveNs, roomId, toUserId, LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, payload)) {
        emitError(socket, roomId, 'PEER_UNAVAILABLE', 'Viewer is not connected');
      }
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.liveClassId;

      if (!roomId) {
        return;
      }

      classRaisedHands(roomId).delete(socket.user.id);
      broadcastPresence(liveNs, roomId);
    });
  });
}

export function resetLiveNamespaceStateForTests() {
  raisedHandsByClass.clear();
}

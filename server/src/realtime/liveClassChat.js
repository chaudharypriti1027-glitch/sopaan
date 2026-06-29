import { LiveClass } from '../models/LiveClass.js';
import { LiveClassChatMessage } from '../models/LiveClassChatMessage.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './events.js';
import { checkChatRateLimit, sanitizeChatMessage } from './moderation.js';
import { getRealtimeIo } from './io.js';

async function assertLiveClassAccess(liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId).select('status title').lean();

  if (!liveClass) {
    return { ok: false, code: 'NOT_FOUND', message: 'Live class not found' };
  }

  if (liveClass.status !== 'live') {
    return { ok: false, code: 'NOT_LIVE', message: 'This class is not live' };
  }

  return { ok: true, liveClass };
}

function trackRoom(socket, room) {
  socket.data.joinedRooms = socket.data.joinedRooms ?? new Set();
  socket.data.joinedRooms.add(room);
}

function formatClassMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: message._id.toString(),
    groupId: message.liveClassId.toString(),
    liveClassId: message.liveClassId.toString(),
    userId: message.userId.toString(),
    userName: message.userName,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export function registerLiveClassChatHandlers(socket) {
  socket.on(SOCKET_EVENTS.CLASS_JOIN, async ({ liveClassId }) => {
    if (!liveClassId) {
      return;
    }

    const access = await assertLiveClassAccess(liveClassId);

    if (!access.ok) {
      socket.emit(SOCKET_EVENTS.CLASS_ERROR, {
        liveClassId,
        code: access.code,
        message: access.message,
      });
      return;
    }

    const room = SOCKET_ROOMS.liveClass(liveClassId);
    await socket.join(room);
    trackRoom(socket, room);

    const history = await LiveClassChatMessage.find({ liveClassId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit(
      SOCKET_EVENTS.CLASS_HISTORY,
      history
        .reverse()
        .map((message) => formatClassMessage(message))
        .filter(Boolean),
    );
  });

  socket.on(SOCKET_EVENTS.CLASS_LEAVE, async ({ liveClassId }) => {
    if (!liveClassId) {
      return;
    }

    await socket.leave(SOCKET_ROOMS.liveClass(liveClassId));
    socket.data.joinedRooms?.delete(SOCKET_ROOMS.liveClass(liveClassId));
  });

  socket.on(SOCKET_EVENTS.CLASS_MESSAGE, async ({ liveClassId, text }) => {
    if (!liveClassId) {
      return;
    }

    const access = await assertLiveClassAccess(liveClassId);

    if (!access.ok) {
      socket.emit(SOCKET_EVENTS.CLASS_ERROR, {
        liveClassId,
        code: access.code,
        message: access.message,
      });
      return;
    }

    const rate = checkChatRateLimit(socket.user.id);

    if (!rate.ok) {
      socket.emit(SOCKET_EVENTS.CLASS_ERROR, {
        liveClassId,
        code: rate.code,
        message: rate.message,
      });
      return;
    }

    const sanitized = sanitizeChatMessage(text);

    if (!sanitized.ok) {
      socket.emit(SOCKET_EVENTS.CLASS_ERROR, {
        liveClassId,
        code: sanitized.code,
        message: sanitized.message,
      });
      return;
    }

    const saved = await LiveClassChatMessage.create({
      liveClassId,
      userId: socket.user.id,
      userName: socket.user.name,
      text: sanitized.text,
    });

    const payload = formatClassMessage(saved.toObject());
    getRealtimeIo()
      ?.to(SOCKET_ROOMS.liveClass(liveClassId))
      .emit(SOCKET_EVENTS.CLASS_MESSAGE_NEW, payload);
  });

  socket.on(SOCKET_EVENTS.CLASS_REACTION, async ({ liveClassId, kind, value }) => {
    if (!liveClassId || !kind) {
      return;
    }

    const access = await assertLiveClassAccess(liveClassId);

    if (!access.ok) {
      socket.emit(SOCKET_EVENTS.CLASS_ERROR, {
        liveClassId,
        code: access.code,
        message: access.message,
      });
      return;
    }

    const payload = {
      liveClassId,
      userId: socket.user.id,
      userName: socket.user.name,
      kind,
      value: value ?? null,
      createdAt: new Date().toISOString(),
    };

    getRealtimeIo()
      ?.to(SOCKET_ROOMS.liveClass(liveClassId))
      .emit(SOCKET_EVENTS.CLASS_REACTION_NEW, payload);
  });
}

export async function rejoinLiveClassRooms(socket) {
  const rooms = socket.data.joinedRooms;

  if (!rooms?.size) {
    return;
  }

  for (const room of rooms) {
    if (!room.startsWith('live-class:')) {
      continue;
    }

    await socket.join(room);
    const liveClassId = room.replace('live-class:', '');
    const history = await LiveClassChatMessage.find({ liveClassId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit(
      SOCKET_EVENTS.CLASS_HISTORY,
      history
        .reverse()
        .map((message) => formatClassMessage(message))
        .filter(Boolean),
    );
  }
}

export { formatClassMessage };

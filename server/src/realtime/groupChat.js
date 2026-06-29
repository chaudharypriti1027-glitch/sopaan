import { StudyGroup } from '../models/StudyGroup.js';
import { GroupChatMessage } from '../models/GroupChatMessage.js';
import { ChatReport } from '../models/ChatReport.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './events.js';
import { checkChatRateLimit, sanitizeChatMessage } from './moderation.js';
import {
  buildLiveMockLeaderboard,
  formatLeaderboardPayload,
} from './liveLeaderboard.js';
import { getRealtimeIo } from './io.js';

async function assertGroupMember(userId, groupId) {
  const group = await StudyGroup.findById(groupId).select('members createdBy name').lean();

  if (!group) {
    return { ok: false, code: 'NOT_FOUND', message: 'Study group not found' };
  }

  const isMember =
    group.createdBy.toString() === userId ||
    group.members.some((memberId) => memberId.toString() === userId);

  if (!isMember) {
    return { ok: false, code: 'FORBIDDEN', message: 'Join the group before opening chat' };
  }

  return { ok: true, group };
}

function trackRoom(socket, room) {
  socket.data.joinedRooms = socket.data.joinedRooms ?? new Set();
  socket.data.joinedRooms.add(room);
}

export function registerLiveMockHandlers(socket) {
  socket.on(SOCKET_EVENTS.LIVE_MOCK_JOIN, async ({ testId }) => {
    if (!testId) {
      return;
    }

    const room = SOCKET_ROOMS.liveMock(testId);
    await socket.join(room);
    trackRoom(socket, room);

    const entries = await buildLiveMockLeaderboard(testId);
    socket.emit(SOCKET_EVENTS.LIVE_MOCK_LEADERBOARD, formatLeaderboardPayload(testId, entries));
  });

  socket.on(SOCKET_EVENTS.LIVE_MOCK_LEAVE, async ({ testId }) => {
    if (!testId) {
      return;
    }

    await socket.leave(SOCKET_ROOMS.liveMock(testId));
    socket.data.joinedRooms?.delete(SOCKET_ROOMS.liveMock(testId));
  });
}

export function registerGroupChatHandlers(socket) {
  socket.on(SOCKET_EVENTS.GROUP_JOIN, async ({ groupId }) => {
    if (!groupId) {
      return;
    }

    const membership = await assertGroupMember(socket.user.id, groupId);

    if (!membership.ok) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: membership.code,
        message: membership.message,
      });
      return;
    }

    const room = SOCKET_ROOMS.group(groupId);
    await socket.join(room);
    trackRoom(socket, room);

    const history = await GroupChatMessage.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit(
      SOCKET_EVENTS.GROUP_HISTORY,
      history
        .reverse()
        .map((message) => formatGroupMessage(message))
        .filter(Boolean),
    );
  });

  socket.on(SOCKET_EVENTS.GROUP_LEAVE, async ({ groupId }) => {
    if (!groupId) {
      return;
    }

    await socket.leave(SOCKET_ROOMS.group(groupId));
    socket.data.joinedRooms?.delete(SOCKET_ROOMS.group(groupId));
  });

  socket.on(SOCKET_EVENTS.GROUP_MESSAGE, async ({ groupId, text }) => {
    if (!groupId) {
      return;
    }

    const membership = await assertGroupMember(socket.user.id, groupId);

    if (!membership.ok) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: membership.code,
        message: membership.message,
      });
      return;
    }

    const rate = checkChatRateLimit(socket.user.id);

    if (!rate.ok) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: rate.code,
        message: rate.message,
      });
      return;
    }

    const sanitized = sanitizeChatMessage(text);

    if (!sanitized.ok) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: sanitized.code,
        message: sanitized.message,
      });
      return;
    }

    const saved = await GroupChatMessage.create({
      groupId,
      userId: socket.user.id,
      userName: socket.user.name,
      text: sanitized.text,
    });

    const payload = formatGroupMessage(saved.toObject());
    getRealtimeIo()?.to(SOCKET_ROOMS.group(groupId)).emit(SOCKET_EVENTS.GROUP_MESSAGE_NEW, payload);
  });

  socket.on(SOCKET_EVENTS.GROUP_REPORT, async ({ groupId, messageId, reason }) => {
    if (!groupId || !messageId) {
      return;
    }

    const membership = await assertGroupMember(socket.user.id, groupId);

    if (!membership.ok) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: membership.code,
        message: membership.message,
      });
      return;
    }

    const message = await GroupChatMessage.findOne({ _id: messageId, groupId }).lean();

    if (!message) {
      socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
        groupId,
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
      return;
    }

    try {
      await ChatReport.create({
        groupId,
        messageId,
        reportedBy: socket.user.id,
        reason: reason?.trim()?.slice(0, 500) ?? '',
      });
    } catch (err) {
      if (err?.code === 11000) {
        socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
          groupId,
          code: 'ALREADY_REPORTED',
          message: 'You already reported this message',
        });
        return;
      }

      throw err;
    }

    socket.emit(SOCKET_EVENTS.GROUP_ERROR, {
      groupId,
      code: 'REPORTED',
      message: 'Thanks — this message was reported for review.',
    });
  });
}

export async function rejoinTrackedRooms(socket) {
  const rooms = socket.data.joinedRooms;

  if (!rooms?.size) {
    return;
  }

  for (const room of rooms) {
    await socket.join(room);

    if (room.startsWith('live-mock:')) {
      const testId = room.replace('live-mock:', '');
      const entries = await buildLiveMockLeaderboard(testId);
      socket.emit(SOCKET_EVENTS.LIVE_MOCK_LEADERBOARD, formatLeaderboardPayload(testId, entries));
    }

    if (room.startsWith('group:')) {
      const groupId = room.replace('group:', '');
      const history = await GroupChatMessage.find({ groupId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit(
        SOCKET_EVENTS.GROUP_HISTORY,
        history
          .reverse()
          .map((message) => formatGroupMessage(message))
          .filter(Boolean),
      );
    }
  }
}

export async function broadcastLiveMockLeaderboard(testId) {
  const io = getRealtimeIo();

  if (!io) {
    return;
  }

  const entries = await buildLiveMockLeaderboard(testId);
  io.to(SOCKET_ROOMS.liveMock(testId)).emit(
    SOCKET_EVENTS.LIVE_MOCK_LEADERBOARD,
    formatLeaderboardPayload(testId, entries),
  );
}

function formatGroupMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: message._id.toString(),
    groupId: message.groupId.toString(),
    userId: message.userId.toString(),
    userName: message.userName,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export { formatGroupMessage };

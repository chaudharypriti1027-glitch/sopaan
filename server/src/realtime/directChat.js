import { DirectMessage } from '../models/DirectMessage.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './events.js';
import { checkChatRateLimit } from './moderation.js';
import {
  assertConversationMember,
  formatDirectMessage,
  saveDirectMessage,
} from '../services/conversationService.js';
import { areFriends } from '../services/friendService.js';
import { getRealtimeIo } from './io.js';

const MAX_MESSAGE_LENGTH = 500;
const ALLOWED_MESSAGE_TYPES = new Set(['text', 'image', 'document']);

function trackRoom(socket, room) {
  socket.data.joinedRooms = socket.data.joinedRooms ?? new Set();
  socket.data.joinedRooms.add(room);
}

function sanitizeDirectMessage({ text, messageType, attachmentUrl }) {
  const trimmed = text?.trim() ?? '';

  if (!ALLOWED_MESSAGE_TYPES.has(messageType)) {
    return { ok: false, code: 'INVALID_TYPE', message: 'Invalid message type' };
  }

  if (messageType === 'text' && !trimmed) {
    return { ok: false, code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' };
  }

  if ((messageType === 'image' || messageType === 'document') && !attachmentUrl?.trim()) {
    return { ok: false, code: 'ATTACHMENT_REQUIRED', message: 'Attachment is required' };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: 'MESSAGE_TOO_LONG',
      message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return { ok: true, text: trimmed };
}

export function registerDirectChatHandlers(socket) {
  socket.on(SOCKET_EVENTS.DM_JOIN, async ({ conversationId }) => {
    if (!conversationId) {
      return;
    }

    const membership = await assertConversationMember(socket.user.id, conversationId);

    if (!membership.ok) {
      socket.emit(SOCKET_EVENTS.DM_ERROR, {
        conversationId,
        code: membership.code,
        message: membership.message,
      });
      return;
    }

    const room = SOCKET_ROOMS.dm(conversationId);
    await socket.join(room);
    trackRoom(socket, room);

    const history = await DirectMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit(
      SOCKET_EVENTS.DM_HISTORY,
      history
        .reverse()
        .map((message) => formatDirectMessage(message))
        .filter(Boolean),
    );
  });

  socket.on(SOCKET_EVENTS.DM_LEAVE, async ({ conversationId }) => {
    if (!conversationId) {
      return;
    }

    await socket.leave(SOCKET_ROOMS.dm(conversationId));
    socket.data.joinedRooms?.delete(SOCKET_ROOMS.dm(conversationId));
  });

  socket.on(
    SOCKET_EVENTS.DM_MESSAGE,
    async ({
      conversationId,
      text,
      messageType = 'text',
      attachmentUrl,
      attachmentName,
      attachmentMimeType,
    }) => {
      if (!conversationId) {
        return;
      }

      const membership = await assertConversationMember(socket.user.id, conversationId);

      if (!membership.ok) {
        socket.emit(SOCKET_EVENTS.DM_ERROR, {
          conversationId,
          code: membership.code,
          message: membership.message,
        });
        return;
      }

      const otherUser = membership.conversation.participants.find(
        (participant) => participant._id.toString() !== socket.user.id,
      );

      const friends = await areFriends(socket.user.id, otherUser?._id);

      if (!friends) {
        socket.emit(SOCKET_EVENTS.DM_ERROR, {
          conversationId,
          code: 'NOT_FRIENDS',
          message: 'You can only message friends',
        });
        return;
      }

      const rate = checkChatRateLimit(socket.user.id);

      if (!rate.ok) {
        socket.emit(SOCKET_EVENTS.DM_ERROR, {
          conversationId,
          code: rate.code,
          message: rate.message,
        });
        return;
      }

      const sanitized = sanitizeDirectMessage({ text, messageType, attachmentUrl });

      if (!sanitized.ok) {
        socket.emit(SOCKET_EVENTS.DM_ERROR, {
          conversationId,
          code: sanitized.code,
          message: sanitized.message,
        });
        return;
      }

      const saved = await saveDirectMessage({
        conversationId,
        senderId: socket.user.id,
        senderName: socket.user.name,
        messageType,
        text: sanitized.text,
        attachmentUrl: attachmentUrl?.trim() ?? '',
        attachmentName: attachmentName?.trim()?.slice(0, 200) ?? '',
        attachmentMimeType: attachmentMimeType?.trim()?.slice(0, 120) ?? '',
      });

      const payload = formatDirectMessage(saved.toObject());
      getRealtimeIo()?.to(SOCKET_ROOMS.dm(conversationId)).emit(SOCKET_EVENTS.DM_MESSAGE_NEW, payload);
    },
  );
}

export async function rejoinDirectRooms(socket) {
  const rooms = socket.data.joinedRooms;

  if (!rooms?.size) {
    return;
  }

  for (const room of rooms) {
    if (!room.startsWith('dm:')) {
      continue;
    }

    await socket.join(room);
    const conversationId = room.replace('dm:', '');
    const history = await DirectMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit(
      SOCKET_EVENTS.DM_HISTORY,
      history
        .reverse()
        .map((message) => formatDirectMessage(message))
        .filter(Boolean),
    );
  }
}

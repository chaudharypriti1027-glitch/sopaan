import { Conversation } from '../models/Conversation.js';
import { DirectMessage } from '../models/DirectMessage.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { areFriends, sortParticipantIds } from './friendService.js';
import { createNotification } from './notificationService.js';
import { emitConversationInboxUpdate } from '../realtime/userRealtime.js';

function formatConversation(conversation, currentUserId) {
  const otherUser = conversation.participants.find(
    (participant) => participant._id.toString() !== currentUserId.toString(),
  );

  return {
    id: conversation._id.toString(),
    friend: otherUser
      ? {
          id: otherUser._id.toString(),
          name: otherUser.name,
          avatarUrl: otherUser.avatarUrl ?? null,
          targetExam: otherUser.targetExam ?? null,
        }
      : null,
    lastMessageAt: conversation.lastMessageAt,
    lastMessageText: conversation.lastMessageText ?? '',
    lastMessageType: conversation.lastMessageType ?? 'text',
  };
}

export async function assertConversationMember(userId, conversationId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name avatarUrl targetExam')
    .lean();

  if (!conversation) {
    return { ok: false, code: 'NOT_FOUND', message: 'Conversation not found' };
  }

  const isMember = conversation.participants.some(
    (participant) => participant._id.toString() === userId.toString(),
  );

  if (!isMember) {
    return { ok: false, code: 'FORBIDDEN', message: 'You cannot access this conversation' };
  }

  return { ok: true, conversation };
}

export async function listConversations(userId, query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    Conversation.find({ participants: userId })
      .populate('participants', 'name avatarUrl targetExam')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Conversation.countDocuments({ participants: userId }),
  ]);

  return buildPaginatedResult({
    items: items.map((conversation) => formatConversation(conversation, userId)),
    total,
    limit,
    offset,
  });
}

export async function getOrCreateConversation(userId, friendUserId) {
  const friends = await areFriends(userId, friendUserId);

  if (!friends) {
    throw new AppError('You can only message friends', 403, 'NOT_FRIENDS');
  }

  const participants = sortParticipantIds(userId, friendUserId);

  let conversation = await Conversation.findOne({ participants })
    .populate('participants', 'name avatarUrl targetExam')
    .lean();

  if (!conversation) {
    const created = await Conversation.create({ participants });
    conversation = await Conversation.findById(created._id)
      .populate('participants', 'name avatarUrl targetExam')
      .lean();
  }

  return formatConversation(conversation, userId);
}

export async function listConversationMessages(userId, conversationId, query) {
  const membership = await assertConversationMember(userId, conversationId);

  if (!membership.ok) {
    throw new AppError(membership.message, membership.code === 'NOT_FOUND' ? 404 : 403, membership.code);
  }

  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    DirectMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    DirectMessage.countDocuments({ conversationId }),
  ]);

  return buildPaginatedResult({
    items: items
      .reverse()
      .map((message) => formatDirectMessage(message))
      .filter(Boolean),
    total,
    limit,
    offset,
  });
}

export function formatDirectMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId.toString(),
    senderName: message.senderName,
    messageType: message.messageType,
    text: message.text ?? '',
    attachmentUrl: message.attachmentUrl ?? '',
    attachmentName: message.attachmentName ?? '',
    attachmentMimeType: message.attachmentMimeType ?? '',
    createdAt: message.createdAt,
  };
}

export async function saveDirectMessage({
  conversationId,
  senderId,
  senderName,
  messageType = 'text',
  text = '',
  attachmentUrl = '',
  attachmentName = '',
  attachmentMimeType = '',
}) {
  const saved = await DirectMessage.create({
    conversationId,
    senderId,
    senderName,
    messageType,
    text,
    attachmentUrl,
    attachmentName,
    attachmentMimeType,
  });

  const preview =
    messageType === 'image'
      ? 'Photo'
      : messageType === 'document'
        ? attachmentName || 'Document'
        : text;

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: saved.createdAt,
    lastMessageText: preview.slice(0, 200),
    lastMessageType: messageType,
  });

  const conversation = await Conversation.findById(conversationId).select('participants').lean();
  const recipientId = conversation?.participants?.find(
    (participantId) => participantId.toString() !== senderId.toString(),
  );

  if (recipientId) {
    const sender = await User.findById(senderId).select('name').lean();

    await createNotification(recipientId, {
      type: 'new_message',
      title: `Message from ${sender?.name ?? 'your friend'}`,
      body: preview.slice(0, 120),
      data: {
        conversationId: conversationId.toString(),
        friendUserId: senderId.toString(),
      },
    });
  }

  await broadcastConversationInboxUpdate(conversationId);

  return saved;
}

export async function broadcastConversationInboxUpdate(conversationId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name avatarUrl targetExam')
    .lean();

  if (!conversation) {
    return;
  }

  for (const participant of conversation.participants) {
    const summary = formatConversation(conversation, participant._id);
    emitConversationInboxUpdate(participant._id.toString(), summary);
  }
}

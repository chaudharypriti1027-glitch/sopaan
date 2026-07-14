import { apiClient } from './client';
import type { PaginatedResponse } from './types';
import type { FriendUser } from './friends';

export type ConversationSummary = {
  id: string;
  friend: FriendUser | null;
  lastMessageAt: string | null;
  lastMessageText: string;
  lastMessageType: 'text' | 'image' | 'document';
};

export type DirectChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  messageType: 'text' | 'image' | 'document';
  text: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentMimeType: string;
  createdAt: string;
};

export async function listConversations(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<ConversationSummary>>('/conversations', {
    params,
  });
  return data;
}

export async function getOrCreateConversation(friendUserId: string) {
  const { data } = await apiClient.post<ConversationSummary>('/conversations', { friendUserId });
  return data;
}

export async function listConversationMessages(
  conversationId: string,
  params?: { limit?: number; offset?: number },
) {
  const { data } = await apiClient.get<PaginatedResponse<DirectChatMessage>>(
    `/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}

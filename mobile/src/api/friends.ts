import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export type FriendUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetExam: string | null;
  relationStatus?: 'pending' | 'accepted' | 'rejected' | null;
};

export type FriendRequestItem = {
  id: string;
  fromUser: FriendUser;
  createdAt: string;
};

export async function searchFriends(q: string, params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<FriendUser>>('/friends/search', {
    params: { q, ...params },
  });
  return data;
}

export async function listFriends(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<FriendUser>>('/friends', { params });
  return data;
}

export async function listFriendRequests(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<FriendRequestItem>>('/friends/requests', {
    params,
  });
  return data;
}

export async function sendFriendRequest(userId: string) {
  const { data } = await apiClient.post('/friends', { userId });
  return data;
}

export async function respondFriendRequest(requestId: string, action: 'accept' | 'reject') {
  const { data } = await apiClient.post(`/friends/requests/${requestId}/respond`, { action });
  return data;
}

export async function removeFriend(userId: string) {
  const { data } = await apiClient.delete(`/friends/${userId}`);
  return data;
}

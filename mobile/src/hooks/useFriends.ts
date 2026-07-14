import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listFriendRequests,
  listFriends,
  removeFriend,
  respondFriendRequest,
  searchFriends,
  sendFriendRequest,
} from '../api/friends';
import { getOrCreateConversation, listConversations } from '../api/conversations';
import { queryKeys } from './queryKeys';

export function useFriends(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.friends.list(params),
    queryFn: () => listFriends(params),
  });
}

export function useFriendRequests(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.friends.requests(params),
    queryFn: () => listFriendRequests(params),
  });
}

export function useSearchStudents(q: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.friends.search(q),
    queryFn: () => searchFriends(q),
    enabled: enabled && q.trim().length >= 2,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => sendFriendRequest(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useRespondFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) =>
      respondFriendRequest(requestId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeFriend(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useConversations(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => listConversations(params),
  });
}

export function useOpenConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendUserId: string) => getOrCreateConversation(friendUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { SOCKET_EVENTS, type ContentUpdatedPayload } from '../realtime/events';
import { getSocket } from '../realtime/socketManager';
import { invalidateStudentContentQueries } from './invalidateStudentContent';
import { queryKeys } from './queryKeys';
import { useSocketStatus } from './useSocket';

export function useRealtimeInbox() {
  const { isAuthenticated } = useAuth();
  const connected = useSocketStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !connected) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const refreshFriends = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };

    const refreshConversations = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    };

    const onTaskUpdate = (payload: { domain?: string }) => {
      if (payload.domain === 'planner' || payload.domain === 'exam-plan') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.planner.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.examPlan.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dailyRoutine.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      }
    };

    const onContentUpdated = (payload: ContentUpdatedPayload) => {
      if (payload?.domain) {
        invalidateStudentContentQueries(queryClient, payload.domain);
      }
    };

    socket.on(SOCKET_EVENTS.FRIEND_REQUEST_NEW, refreshFriends);
    socket.on(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, refreshFriends);
    socket.on(SOCKET_EVENTS.DM_INBOX_UPDATE, refreshConversations);
    socket.on(SOCKET_EVENTS.APP_TASK_UPDATE, onTaskUpdate);
    socket.on(SOCKET_EVENTS.CONTENT_UPDATED, onContentUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.FRIEND_REQUEST_NEW, refreshFriends);
      socket.off(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, refreshFriends);
      socket.off(SOCKET_EVENTS.DM_INBOX_UPDATE, refreshConversations);
      socket.off(SOCKET_EVENTS.APP_TASK_UPDATE, onTaskUpdate);
      socket.off(SOCKET_EVENTS.CONTENT_UPDATED, onContentUpdated);
    };
  }, [isAuthenticated, connected, queryClient]);
}

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { getAccessToken } from '../lib/secure';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  offSocketReconnect,
  onSocketReconnect,
  refreshSocketAuth,
} from '../realtime/socketManager';
import {
  SOCKET_EVENTS,
  type GroupChatError,
  type GroupChatMessage,
  type LiveClassReaction,
  type LiveMockLeaderboardPayload,
} from '../realtime/events';

export function useSocketConnection() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    void connectSocket(getAccessToken);

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);
}

export function useSocketStatus() {
  const [connected, setConnected] = useState(isSocketConnected());

  useEffect(() => {
    const sync = () => setConnected(isSocketConnected());
    const interval = setInterval(sync, 1000);
    const socket = getSocket();

    socket?.on('connect', sync);
    socket?.on('disconnect', sync);

    return () => {
      clearInterval(interval);
      socket?.off('connect', sync);
      socket?.off('disconnect', sync);
    };
  }, []);

  return connected;
}

export function useLiveMockLeaderboard(testId?: string) {
  const connected = useSocketStatus();
  const [leaderboard, setLeaderboard] = useState<LiveMockLeaderboardPayload | null>(null);

  useEffect(() => {
    const socket = getSocket();

    if (!testId || !socket) {
      return;
    }

    const onUpdate = (payload: LiveMockLeaderboardPayload) => {
      if (payload.testId === testId) {
        setLeaderboard(payload);
      }
    };

    socket.on(SOCKET_EVENTS.LIVE_MOCK_LEADERBOARD, onUpdate);

    const join = () => {
      socket.emit(SOCKET_EVENTS.LIVE_MOCK_JOIN, { testId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const rejoin = () => join();
    onSocketReconnect(rejoin);

    return () => {
      socket.off(SOCKET_EVENTS.LIVE_MOCK_LEADERBOARD, onUpdate);
      socket.off('connect', join);
      offSocketReconnect();
      socket.emit(SOCKET_EVENTS.LIVE_MOCK_LEAVE, { testId });
    };
  }, [testId, connected]);

  return leaderboard;
}

export function useGroupChat(groupId?: string) {
  const connected = useSocketStatus();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [error, setError] = useState<GroupChatError | null>(null);

  useEffect(() => {
    const socket = getSocket();

    if (!groupId || !socket) {
      return;
    }

    const onHistory = (history: GroupChatMessage[]) => {
      setMessages(history);
    };

    const onMessage = (message: GroupChatMessage) => {
      if (message.groupId === groupId) {
        setMessages((current) => [...current, message]);
      }
    };

    const onError = (payload: GroupChatError) => {
      if (!payload.groupId || payload.groupId === groupId) {
        setError(payload);
      }
    };

    socket.on(SOCKET_EVENTS.GROUP_HISTORY, onHistory);
    socket.on(SOCKET_EVENTS.GROUP_MESSAGE_NEW, onMessage);
    socket.on(SOCKET_EVENTS.GROUP_ERROR, onError);

    const join = () => {
      socket.emit(SOCKET_EVENTS.GROUP_JOIN, { groupId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const rejoin = () => join();
    onSocketReconnect(rejoin);

    return () => {
      socket.off(SOCKET_EVENTS.GROUP_HISTORY, onHistory);
      socket.off(SOCKET_EVENTS.GROUP_MESSAGE_NEW, onMessage);
      socket.off(SOCKET_EVENTS.GROUP_ERROR, onError);
      socket.off('connect', join);
      offSocketReconnect();
      socket.emit(SOCKET_EVENTS.GROUP_LEAVE, { groupId });
    };
  }, [groupId, connected]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const socket = getSocket();
      if (!groupId || !socket?.connected) {
        return false;
      }

      setError(null);
      socket.emit(SOCKET_EVENTS.GROUP_MESSAGE, { groupId, text });
      return true;
    },
    [groupId],
  );

  const reportMessage = useCallback(
    (messageId: string, reason?: string) => {
      const socket = getSocket();
      if (!groupId || !socket?.connected) {
        return;
      }

      socket.emit(SOCKET_EVENTS.GROUP_REPORT, { groupId, messageId, reason });
    },
    [groupId],
  );

  return {
    messages,
    error,
    sendMessage,
    reportMessage,
    currentUserId: user?.id,
    connected,
  };
}

export async function refreshRealtimeAuth() {
  await refreshSocketAuth(getAccessToken);
}

export function useLiveClassChat(liveClassId?: string) {
  const connected = useSocketStatus();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [error, setError] = useState<GroupChatError | null>(null);
  const [reactions, setReactions] = useState<LiveClassReaction[]>([]);

  useEffect(() => {
    const socket = getSocket();

    if (!liveClassId || !socket) {
      return;
    }

    const onHistory = (history: GroupChatMessage[]) => {
      setMessages(history);
    };

    const onMessage = (message: GroupChatMessage) => {
      const roomId = message.groupId;
      if (roomId === liveClassId) {
        setMessages((current) => [...current, message]);
      }
    };

    const onError = (payload: GroupChatError) => {
      if (!payload.liveClassId || payload.liveClassId === liveClassId) {
        setError(payload);
      }
    };

    const onReaction = (payload: LiveClassReaction) => {
      if (payload.liveClassId === liveClassId) {
        setReactions((current) => [...current.slice(-19), payload]);
      }
    };

    socket.on(SOCKET_EVENTS.CLASS_HISTORY, onHistory);
    socket.on(SOCKET_EVENTS.CLASS_MESSAGE_NEW, onMessage);
    socket.on(SOCKET_EVENTS.CLASS_ERROR, onError);
    socket.on(SOCKET_EVENTS.CLASS_REACTION_NEW, onReaction);

    const join = () => {
      socket.emit(SOCKET_EVENTS.CLASS_JOIN, { liveClassId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const rejoin = () => join();
    onSocketReconnect(rejoin);

    return () => {
      socket.off(SOCKET_EVENTS.CLASS_HISTORY, onHistory);
      socket.off(SOCKET_EVENTS.CLASS_MESSAGE_NEW, onMessage);
      socket.off(SOCKET_EVENTS.CLASS_ERROR, onError);
      socket.off(SOCKET_EVENTS.CLASS_REACTION_NEW, onReaction);
      socket.off('connect', join);
      offSocketReconnect();
      socket.emit(SOCKET_EVENTS.CLASS_LEAVE, { liveClassId });
    };
  }, [liveClassId, connected]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const socket = getSocket();
      if (!liveClassId || !socket?.connected) {
        return false;
      }

      setError(null);
      socket.emit(SOCKET_EVENTS.CLASS_MESSAGE, { liveClassId, text });
      return true;
    },
    [liveClassId],
  );

  const sendReaction = useCallback(
    (kind: LiveClassReaction['kind'], value?: string) => {
      const socket = getSocket();
      if (!liveClassId || !socket?.connected) {
        return false;
      }

      socket.emit(SOCKET_EVENTS.CLASS_REACTION, { liveClassId, kind, value });
      return true;
    },
    [liveClassId],
  );

  return {
    messages,
    reactions,
    error,
    sendMessage,
    sendReaction,
    currentUserId: user?.id,
    connected,
  };
}

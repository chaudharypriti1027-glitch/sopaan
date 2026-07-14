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
  connectLiveSocket,
  disconnectLiveSocket,
  getLiveSocket,
  isLiveSocketConnected,
} from '../realtime/liveSocket';
import {
  LIVE_NS_EVENTS,
  SOCKET_EVENTS,
  type DirectChatMessage,
  type GroupChatError,
  type GroupChatMessage,
  type LiveChatMessage,
  type LiveMockLeaderboardPayload,
  type LivePresenceParticipant,
  type LiveReaction,
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

export type DirectMessageInput = {
  text?: string;
  messageType?: 'text' | 'image' | 'document';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

export function useDirectChat(conversationId?: string) {
  const connected = useSocketStatus();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [error, setError] = useState<GroupChatError | null>(null);

  useEffect(() => {
    const socket = getSocket();

    if (!conversationId || !socket) {
      return;
    }

    const onHistory = (history: DirectChatMessage[]) => {
      setMessages(history);
    };

    const onMessage = (message: DirectChatMessage) => {
      if (message.conversationId === conversationId) {
        setMessages((current) =>
          current.some((entry) => entry.id === message.id) ? current : [...current, message],
        );
      }
    };

    const onError = (payload: GroupChatError) => {
      if (!payload.conversationId || payload.conversationId === conversationId) {
        setError(payload);
      }
    };

    socket.on(SOCKET_EVENTS.DM_HISTORY, onHistory);
    socket.on(SOCKET_EVENTS.DM_MESSAGE_NEW, onMessage);
    socket.on(SOCKET_EVENTS.DM_ERROR, onError);

    const join = () => {
      socket.emit(SOCKET_EVENTS.DM_JOIN, { conversationId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const rejoin = () => join();
    onSocketReconnect(rejoin);

    return () => {
      socket.off(SOCKET_EVENTS.DM_HISTORY, onHistory);
      socket.off(SOCKET_EVENTS.DM_MESSAGE_NEW, onMessage);
      socket.off(SOCKET_EVENTS.DM_ERROR, onError);
      socket.off('connect', join);
      offSocketReconnect();
      socket.emit(SOCKET_EVENTS.DM_LEAVE, { conversationId });
    };
  }, [conversationId, connected]);

  const sendMessage = useCallback(
    (input: DirectMessageInput): boolean => {
      const socket = getSocket();
      if (!conversationId || !socket?.connected) {
        return false;
      }

      setError(null);
      socket.emit(SOCKET_EVENTS.DM_MESSAGE, {
        conversationId,
        text: input.text ?? '',
        messageType: input.messageType ?? 'text',
        attachmentUrl: input.attachmentUrl,
        attachmentName: input.attachmentName,
        attachmentMimeType: input.attachmentMimeType,
      });
      return true;
    },
    [conversationId],
  );

  return {
    messages,
    error,
    sendMessage,
    currentUserId: user?.id,
    connected,
  };
}

export async function refreshRealtimeAuth() {
  await refreshSocketAuth(getAccessToken);
}

export function useLiveClassChat(liveClassId?: string) {
  const { user, isAuthenticated } = useAuth();
  const [liveConnected, setLiveConnected] = useState(isLiveSocketConnected());
  const [joinedClass, setJoinedClass] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [error, setError] = useState<GroupChatError | null>(null);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [participants, setParticipants] = useState<LivePresenceParticipant[]>([]);
  const [muteAllSignal, setMuteAllSignal] = useState(0);
  const [hostAnnouncement, setHostAnnouncement] = useState<string | null>(null);
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectLiveSocket();
      setLiveConnected(false);
      setJoinedClass(false);
      return;
    }

    void connectLiveSocket(getAccessToken);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!liveClassId) {
      return;
    }

    let cancelled = false;

    const bindSocket = (socket: NonNullable<ReturnType<typeof getLiveSocket>>) => {
      const onConnect = () => {
        if (!cancelled) {
          setLiveConnected(true);
        }
      };

      const onDisconnect = () => {
        if (!cancelled) {
          setLiveConnected(false);
          setJoinedClass(false);
        }
      };

      const onHistory = ({
        classId,
        messages: history,
      }: {
        classId: string;
        messages: LiveChatMessage[];
      }) => {
        if (classId === liveClassId) {
          setMessages(history);
          setJoinedClass(true);
        }
      };

      const onMessage = (message: LiveChatMessage) => {
        if (message.classId === liveClassId) {
          setMessages((current) => [...current, message]);
        }
      };

      const onPresence = ({
        classId,
        count,
        participants: nextParticipants,
      }: {
        classId: string;
        count: number;
        participants: LivePresenceParticipant[];
      }) => {
        if (classId === liveClassId) {
          setPresenceCount(count);
          setParticipants(nextParticipants);
          setJoinedClass(true);
        }
      };

      const onReaction = (payload: LiveReaction) => {
        if (payload.classId === liveClassId) {
          setReactions((current) => [...current.slice(-19), payload]);
        }
      };

      const onMuteAll = ({ classId }: { classId: string }) => {
        if (classId === liveClassId) {
          setMuteAllSignal((value) => value + 1);
        }
      };

      const onAnnouncement = ({
        classId,
        message,
        authorName,
      }: {
        classId: string;
        message: string;
        authorName?: string;
      }) => {
        if (classId === liveClassId) {
          setHostAnnouncement(message);
        }
      };

      const onHandAck = ({
        classId,
        message,
      }: {
        classId: string;
        message: string;
      }) => {
        if (classId === liveClassId && message) {
          setMessages((current) => [
            ...current,
            {
              id: `hand-ack-${Date.now()}`,
              classId: liveClassId,
              userId: 'hand-ack',
              userName: 'Host',
              text: message,
              createdAt: new Date().toISOString(),
              isHost: true,
            },
          ]);
        }
      };

      const onError = (payload: GroupChatError & { classId?: string }) => {
        if (!payload.classId || payload.classId === liveClassId) {
          setError(payload);
        }
      };

      const join = () => {
        socket.emit(LIVE_NS_EVENTS.JOIN, { classId: liveClassId });
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on(LIVE_NS_EVENTS.CHAT_HISTORY, onHistory);
      socket.on(LIVE_NS_EVENTS.CHAT_MESSAGE, onMessage);
      socket.on(LIVE_NS_EVENTS.PRESENCE, onPresence);
      socket.on(LIVE_NS_EVENTS.REACTION, onReaction);
      socket.on(LIVE_NS_EVENTS.HOST_MUTE_ALL, onMuteAll);
      socket.on(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, onAnnouncement);
      socket.on(LIVE_NS_EVENTS.HAND_ACK, onHandAck);
      socket.on(LIVE_NS_EVENTS.ERROR, onError);

      if (socket.connected) {
        setLiveConnected(true);
        join();
      } else {
        socket.once('connect', join);
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off(LIVE_NS_EVENTS.CHAT_HISTORY, onHistory);
        socket.off(LIVE_NS_EVENTS.CHAT_MESSAGE, onMessage);
        socket.off(LIVE_NS_EVENTS.PRESENCE, onPresence);
        socket.off(LIVE_NS_EVENTS.REACTION, onReaction);
        socket.off(LIVE_NS_EVENTS.HOST_MUTE_ALL, onMuteAll);
        socket.off(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, onAnnouncement);
        socket.off(LIVE_NS_EVENTS.HAND_ACK, onHandAck);
        socket.off(LIVE_NS_EVENTS.ERROR, onError);
        socket.off('connect', join);
        socket.emit(LIVE_NS_EVENTS.LEAVE, { classId: liveClassId });
        setHandRaised(false);
        setJoinedClass(false);
      };
    };

    let cleanup: (() => void) | undefined;
    const existing = getLiveSocket();

    if (existing) {
      cleanup = bindSocket(existing);
    } else {
      void connectLiveSocket(getAccessToken).then((socket) => {
        if (cancelled || !socket) {
          return;
        }

        cleanup = bindSocket(socket);
      });
    }

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [liveClassId]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const socket = getLiveSocket();
      if (!liveClassId || !socket?.connected) {
        return false;
      }

      setError(null);
      socket.emit(LIVE_NS_EVENTS.CHAT_MESSAGE, { classId: liveClassId, text });
      return true;
    },
    [liveClassId],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      const socket = getLiveSocket();
      if (!liveClassId || !socket?.connected) {
        return false;
      }

      socket.emit(LIVE_NS_EVENTS.REACTION, { classId: liveClassId, emoji });
      return true;
    },
    [liveClassId],
  );

  const raiseHand = useCallback(() => {
    const socket = getLiveSocket();
    if (!liveClassId || !socket?.connected) {
      return false;
    }

    socket.emit(LIVE_NS_EVENTS.HAND_RAISE, { classId: liveClassId });
    setHandRaised(true);
    return true;
  }, [liveClassId]);

  const lowerHand = useCallback(() => {
    const socket = getLiveSocket();
    if (!liveClassId || !socket?.connected) {
      return false;
    }

    socket.emit(LIVE_NS_EVENTS.HAND_LOWER, { classId: liveClassId });
    setHandRaised(false);
    return true;
  }, [liveClassId]);

  return {
    messages,
    reactions,
    error,
    sendMessage,
    sendReaction,
    raiseHand,
    lowerHand,
    handRaised,
    presenceCount,
    participants,
    muteAllSignal,
    hostAnnouncement,
    currentUserId: user?.id,
    hostUserId:
      participants.find((entry) => entry.isHost)?.userId ??
      messages.find((message) => message.isHost)?.userId,
    connected: liveConnected && joinedClass,
  };
}

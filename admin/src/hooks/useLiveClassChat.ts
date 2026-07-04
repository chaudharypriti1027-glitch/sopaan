import { useCallback, useEffect, useState } from 'react';
import {
  LIVE_NS_EVENTS,
  type LiveChatMessage,
  type LiveHandNotify,
  type LiveNamespaceError,
  type LivePresenceParticipant,
  type LiveReaction,
} from '../realtime/events';
import {
  connectAdminLiveSocket,
  getLiveSocket,
  isLiveSocketConnected,
} from '../realtime/liveSocket';

export function useLiveClassChat(liveClassId?: string, { isHost = true } = {}) {
  const [connected, setConnected] = useState(isLiveSocketConnected());
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [participants, setParticipants] = useState<LivePresenceParticipant[]>([]);
  const [handNotifications, setHandNotifications] = useState<LiveHandNotify[]>([]);
  const [error, setError] = useState<LiveNamespaceError | null>(null);

  useEffect(() => {
    if (!liveClassId) {
      return;
    }

    connectAdminLiveSocket();
    const socket = getLiveSocket();

    if (!socket) {
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onHistory = ({ classId, messages: history }: { classId: string; messages: LiveChatMessage[] }) => {
      if (classId === liveClassId) {
        setMessages(history);
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
      }
    };

    const onReaction = (payload: LiveReaction) => {
      if (payload.classId === liveClassId) {
        setReactions((current) => [...current.slice(-19), payload]);
      }
    };

    const onHandNotify = (payload: LiveHandNotify) => {
      if (payload.classId === liveClassId && isHost) {
        setHandNotifications((current) => [...current.slice(-9), payload]);
      }
    };

    const onError = (payload: LiveNamespaceError) => {
      if (!payload.classId || payload.classId === liveClassId) {
        setError(payload);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(LIVE_NS_EVENTS.CHAT_HISTORY, onHistory);
    socket.on(LIVE_NS_EVENTS.CHAT_MESSAGE, onMessage);
    socket.on(LIVE_NS_EVENTS.PRESENCE, onPresence);
    socket.on(LIVE_NS_EVENTS.REACTION, onReaction);
    socket.on(LIVE_NS_EVENTS.HAND_NOTIFY, onHandNotify);
    socket.on(LIVE_NS_EVENTS.ERROR, onError);

    const join = () => {
      socket.emit(LIVE_NS_EVENTS.JOIN, { classId: liveClassId });
    };

    if (socket.connected) {
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
      socket.off(LIVE_NS_EVENTS.HAND_NOTIFY, onHandNotify);
      socket.off(LIVE_NS_EVENTS.ERROR, onError);
      socket.off('connect', join);
      socket.emit(LIVE_NS_EVENTS.LEAVE, { classId: liveClassId });
    };
  }, [liveClassId, isHost]);

  const sendMessage = useCallback(
    (text: string) => {
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
    return true;
  }, [liveClassId]);

  const lowerHand = useCallback(() => {
    const socket = getLiveSocket();
    if (!liveClassId || !socket?.connected) {
      return false;
    }

    socket.emit(LIVE_NS_EVENTS.HAND_LOWER, { classId: liveClassId });
    return true;
  }, [liveClassId]);

  const muteAllStudents = useCallback(() => {
    const socket = getLiveSocket();
    if (!liveClassId || !socket?.connected || !isHost) {
      return false;
    }

    socket.emit(LIVE_NS_EVENTS.HOST_MUTE_ALL, { classId: liveClassId });
    return true;
  }, [isHost, liveClassId]);

  const sendAnnouncement = useCallback(
    (message: string) => {
      const socket = getLiveSocket();
      if (!liveClassId || !socket?.connected || !isHost) {
        return false;
      }

      socket.emit(LIVE_NS_EVENTS.HOST_ANNOUNCEMENT, { classId: liveClassId, message });
      return true;
    },
    [isHost, liveClassId],
  );

  return {
    connected,
    messages,
    reactions,
    presenceCount,
    participants,
    handNotifications,
    error,
    sendMessage,
    sendReaction,
    raiseHand,
    lowerHand,
    muteAllStudents,
    sendAnnouncement,
  };
}

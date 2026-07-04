export const LIVE_NS_EVENTS = {
  JOIN: 'join',
  LEAVE: 'leave',
  PRESENCE: 'presence',
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',
  REACTION: 'reaction',
  HAND_RAISE: 'hand:raise',
  HAND_LOWER: 'hand:lower',
  HAND_NOTIFY: 'hand:notify',
  HOST_MUTE_ALL: 'host:muteAll',
  HOST_ANNOUNCEMENT: 'host:announcement',
  DEV_STREAM_REQUEST: 'dev-stream:request',
  DEV_STREAM_SIGNAL: 'dev-stream:signal',
  ERROR: 'error',
} as const;

export const ADMIN_NS_EVENTS = {
  COUNTERS: 'admin:counters',
  ERROR: 'admin:error',
} as const;

export interface LiveChatMessage {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface LivePresenceParticipant {
  userId: string;
  name: string;
  isHost?: boolean;
}

export interface LiveReaction {
  classId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface LiveHandNotify {
  classId: string;
  userId: string;
  userName: string;
  raised: boolean;
  createdAt: string;
}

export interface LiveNamespaceError {
  classId?: string;
  code: string;
  message: string;
}

export interface AdminDashboardCounters {
  pendingReviews: number;
  pendingQuestionReviews: number;
  liveClasses: number;
  at: string;
}

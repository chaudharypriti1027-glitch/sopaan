export const SOCKET_EVENTS = {
  LIVE_MOCK_JOIN: 'live-mock:join',
  LIVE_MOCK_LEAVE: 'live-mock:leave',
  LIVE_MOCK_LEADERBOARD: 'live-mock:leaderboard',

  GROUP_JOIN: 'group:join',
  GROUP_LEAVE: 'group:leave',
  GROUP_MESSAGE: 'group:message',
  GROUP_MESSAGE_NEW: 'group:message:new',
  GROUP_HISTORY: 'group:history',
  GROUP_REPORT: 'group:report',
  GROUP_ERROR: 'group:error',

  DM_JOIN: 'dm:join',
  DM_LEAVE: 'dm:leave',
  DM_MESSAGE: 'dm:message',
  DM_MESSAGE_NEW: 'dm:message:new',
  DM_HISTORY: 'dm:history',
  DM_ERROR: 'dm:error',
  DM_INBOX_UPDATE: 'dm:inbox:update',

  FRIEND_REQUEST_NEW: 'friend:request:new',
  FRIEND_REQUEST_ACCEPTED: 'friend:request:accepted',

  APP_TASK_UPDATE: 'app:task:update',

  CONTENT_UPDATED: 'content:updated',

  CLASS_JOIN: 'class:join',
  CLASS_LEAVE: 'class:leave',
  CLASS_MESSAGE: 'class:message',
  CLASS_MESSAGE_NEW: 'class:message:new',
  CLASS_HISTORY: 'class:history',
  CLASS_ERROR: 'class:error',
  CLASS_REACTION: 'class:reaction',
  CLASS_REACTION_NEW: 'class:reaction:new',

  REJOIN: 'realtime:rejoin',
} as const;

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
  HAND_ACK: 'hand:ack',
  HOST_MUTE_ALL: 'host:muteAll',
  HOST_ANNOUNCEMENT: 'host:announcement',
  DEV_STREAM_REQUEST: 'dev-stream:request',
  DEV_STREAM_SIGNAL: 'dev-stream:signal',
  ERROR: 'error',
} as const;

export type LiveMockLeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  score: number;
  accuracy: number;
  totalTimeSec: number;
  submittedAt?: string;
};

export type LiveMockLeaderboardPayload = {
  testId: string;
  entries: LiveMockLeaderboardEntry[];
  updatedAt: string;
};

export type GroupChatMessage = {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

export type GroupChatError = {
  groupId?: string;
  liveClassId?: string;
  conversationId?: string;
  code: string;
  message: string;
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

export type ConversationSummary = {
  id: string;
  friend: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetExam: string | null;
  } | null;
  lastMessageText: string;
  lastMessageType: 'text' | 'image' | 'document';
  lastMessageAt: string;
};

export type FriendRequestRealtimePayload = {
  id: string;
  fromUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetExam: string | null;
  };
  createdAt: string;
};

export type FriendAcceptedRealtimePayload = {
  friend: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetExam: string | null;
  };
};

export type AppTaskUpdatePayload = {
  domain: 'planner' | 'exam-plan' | string;
  action: string;
  sessionId?: string;
  date?: string;
  completed?: boolean;
};

export type ContentUpdatedPayload = {
  domain: string;
  action?: string;
  updatedAt?: string;
  liveClassId?: string;
  bookId?: string;
  testId?: string;
};

export type LiveClassReaction = {
  liveClassId: string;
  userId: string;
  userName: string;
  kind: 'raise_hand' | 'emoji';
  value?: string | null;
  createdAt: string;
};

export type LiveChatMessage = {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isHost?: boolean;
};

export type LiveReaction = {
  classId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
};

export type LivePresenceParticipant = {
  userId: string;
  name: string;
  isHost?: boolean;
};

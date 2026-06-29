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
  code: string;
  message: string;
};

export type LiveClassReaction = {
  liveClassId: string;
  userId: string;
  userName: string;
  kind: 'raise_hand' | 'emoji';
  value?: string | null;
  createdAt: string;
};

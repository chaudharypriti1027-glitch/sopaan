export const SOCKET_EVENTS = Object.freeze({
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
});

export const SOCKET_ROOMS = Object.freeze({
  liveMock: (testId) => `live-mock:${testId}`,
  group: (groupId) => `group:${groupId}`,
  dm: (conversationId) => `dm:${conversationId}`,
  user: (userId) => `user:${userId}`,
  liveClass: (liveClassId) => `live-class:${liveClassId}`,
});

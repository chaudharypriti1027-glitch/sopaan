export const LIVE_NS_EVENTS = Object.freeze({
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
});

export const LIVE_REACTION_EMOJIS = Object.freeze(['👍', '🔥', '👏']);

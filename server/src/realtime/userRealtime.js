import { getRealtimeIo } from './io.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './events.js';

export function emitToUser(userId, event, payload) {
  if (!userId) {
    return;
  }

  getRealtimeIo()?.to(SOCKET_ROOMS.user(String(userId))).emit(event, payload);
}

export function emitFriendRequestNew(toUserId, payload) {
  emitToUser(toUserId, SOCKET_EVENTS.FRIEND_REQUEST_NEW, payload);
}

export function emitFriendRequestAccepted(userId, payload) {
  emitToUser(userId, SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, payload);
}

export function emitConversationInboxUpdate(userId, payload) {
  emitToUser(userId, SOCKET_EVENTS.DM_INBOX_UPDATE, payload);
}

export function emitAppTaskUpdate(userId, payload) {
  emitToUser(userId, SOCKET_EVENTS.APP_TASK_UPDATE, payload);
}

export function joinUserInboxRoom(socket) {
  const room = SOCKET_ROOMS.user(socket.user.id);
  socket.join(room);
  socket.data.userInboxRoom = room;
}

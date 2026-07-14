import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../api/storage';
import { ADMIN_NS_EVENTS, type AdminDashboardCounters, type AdminLivePresencePayload } from './events';
import { getSocketOrigin } from './socketOrigin';

let socket: Socket | null = null;
let socketOrigin: string | null = null;

function resetSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function connectAdminSocket() {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const origin = getSocketOrigin();
  if (socket && socketOrigin !== origin) {
    resetSocket();
  }

  if (socket?.connected) {
    return socket;
  }

  socketOrigin = origin;
  socket = io(`${origin}/admin`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectAdminSocket() {
  resetSocket();
  socketOrigin = null;
}

export function onAdminDashboardCounters(handler: (counters: AdminDashboardCounters) => void) {
  const client = connectAdminSocket();
  if (!client) {
    return () => {};
  }

  client.on(ADMIN_NS_EVENTS.COUNTERS, handler);
  return () => {
    client.off(ADMIN_NS_EVENTS.COUNTERS, handler);
  };
}

export function onAdminLivePresence(handler: (payload: AdminLivePresencePayload) => void) {
  const client = connectAdminSocket();
  if (!client) {
    return () => {};
  }

  client.on(ADMIN_NS_EVENTS.LIVE_PRESENCE, handler);
  return () => {
    client.off(ADMIN_NS_EVENTS.LIVE_PRESENCE, handler);
  };
}

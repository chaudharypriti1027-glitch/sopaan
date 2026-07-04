import { Platform } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config/env';
import { SOCKET_EVENTS } from './events';

type TokenProvider = () => Promise<string | null>;

let socket: Socket | null = null;
let reconnectHandler: (() => void) | null = null;

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return Boolean(socket?.connected);
}

export async function connectSocket(getToken: TokenProvider) {
  const token = await getToken();

  if (!token) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(config.apiOrigin, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on('connect', () => {
    socket?.emit(SOCKET_EVENTS.REJOIN);
    reconnectHandler?.();
  });

  socket.io.on('reconnect', () => {
    socket?.emit(SOCKET_EVENTS.REJOIN);
    reconnectHandler?.();
  });

  return socket;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export function onSocketReconnect(handler: () => void) {
  reconnectHandler = handler;
}

export function offSocketReconnect() {
  reconnectHandler = null;
}

export async function refreshSocketAuth(getToken: TokenProvider) {
  if (!socket) {
    return;
  }

  const token = await getToken();

  if (!token) {
    disconnectSocket();
    return;
  }

  socket.auth = { token };
}

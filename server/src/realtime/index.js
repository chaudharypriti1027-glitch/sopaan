import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { authenticateSocket } from './auth.js';
import {
  registerGroupChatHandlers,
  registerLiveMockHandlers,
  rejoinTrackedRooms,
} from './groupChat.js';
import { registerLiveClassChatHandlers, rejoinLiveClassRooms } from './liveClassChat.js';
import { setRealtimeIo } from './io.js';

export function initRealtimeServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.clientUrl) {
          callback(null, true);
          return;
        }

        if (env.isDevelopment) {
          const isLocalDev =
            /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin) ||
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(origin) ||
            /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(origin);

          callback(null, isLocalDev);
          return;
        }

        callback(null, false);
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.info(`[realtime] connected user=${socket.user.id}`);

    registerLiveMockHandlers(socket);
    registerGroupChatHandlers(socket);
    registerLiveClassChatHandlers(socket);

    socket.on('realtime:rejoin', async () => {
      await rejoinTrackedRooms(socket);
      await rejoinLiveClassRooms(socket);
    });

    socket.on('disconnect', (reason) => {
      console.info(`[realtime] disconnected user=${socket.user.id} reason=${reason}`);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.warn('[realtime] connection error:', err.message);
  });

  setRealtimeIo(io);
  return io;
}

export { broadcastLiveMockLeaderboard } from './groupChat.js';

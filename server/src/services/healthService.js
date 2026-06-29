import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { drConfig } from '../config/drConfig.js';

export function getHealthStatus() {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const mongoReadyState = mongoose.connection?.readyState ?? 0;

  return {
    status: mongoReadyState === 1 ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    deployEnv: env.deployEnv,
    nodeEnv: env.nodeEnv,
    mongodb: mongoStates[mongoReadyState] ?? 'unknown',
    dr: {
      rtoMinutes: drConfig.rtoMinutes,
      rpoMinutes: drConfig.rpoMinutes,
    },
  };
}

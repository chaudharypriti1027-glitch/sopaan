import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let eventsRegistered = false;
let shutdownHandlersRegistered = false;

function log(event, message) {
  console.log(`[mongodb] ${event}: ${message}`);
}

function registerConnectionEvents() {
  if (eventsRegistered) {
    return;
  }

  eventsRegistered = true;

  mongoose.connection.on('connected', () => {
    log('connected', 'Connection established');
  });

  mongoose.connection.on('error', (err) => {
    log('error', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    log('disconnected', 'Connection lost');
  });

  mongoose.connection.on('reconnected', () => {
    log('reconnected', 'Connection restored');
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase() {
  registerConnectionEvents();

  // Prefer IPv4 loopback — avoids ::1 connection refused when mongod binds 127.0.0.1 only.
  const uri = env.mongodbUri.replace(
    /^mongodb:\/\/localhost(?=[:/]|$)/,
    'mongodb://127.0.0.1',
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, connectionOptions);
      log('ready', `Connected successfully (attempt ${attempt}/${MAX_RETRIES})`);
      return mongoose.connection;
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      log('connect_failed', `Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

      if (isLastAttempt) {
        throw new Error(
          `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${err.message}`
        );
      }

      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      log('retry', `Retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  log('shutdown', 'Connection closed gracefully');
}

export function registerDatabaseShutdownHandlers(onShutdown) {
  if (shutdownHandlersRegistered) {
    return;
  }

  shutdownHandlersRegistered = true;

  const shutdown = async (signal) => {
    log('signal', `Received ${signal}, shutting down`);

    try {
      if (onShutdown) {
        await onShutdown();
      }

      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      log('shutdown_error', err.message);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

import { observabilityConfig } from '../config/observabilityConfig.js';
import { redactSensitiveData } from './redact.js';
import { getRequestContext } from './requestContext.js';

const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

function shouldLog(level) {
  const minLevel = process.env.LOG_LEVEL?.toLowerCase() === 'debug' ? 'debug' : 'info';
  return LEVELS[level] >= LEVELS[minLevel];
}

function baseFields() {
  const ctx = getRequestContext();

  return {
    service: observabilityConfig.serviceName,
    release: observabilityConfig.release,
    environment: observabilityConfig.environment,
    ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    ...(ctx.userId ? { userId: ctx.userId } : {}),
  };
}

function write(level, message, fields = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = redactSensitiveData({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...baseFields(),
    ...fields,
  });

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = Object.freeze({
  debug: (message, fields) => write('debug', message, fields),
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
});

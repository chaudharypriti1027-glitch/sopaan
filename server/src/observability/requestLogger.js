import { performance } from 'node:perf_hooks';
import { utcDateKey } from '../services/quotaService.js';
import { logger } from './logger.js';
import { recordHttpRequest, setDailyActiveUsers } from './metrics.js';
import {
  createRequestId,
  getRequestContext,
  runWithRequestContext,
} from './requestContext.js';

const activeUsersByDate = new Map();

function normalizeRoute(req) {
  if (req.route?.path) {
    const base = req.baseUrl ?? '';
    return `${base}${req.route.path}`.replace(/\/+/g, '/');
  }

  return (req.path ?? req.originalUrl ?? '/')
    .split('?')[0]
    .replace(/\/[a-f0-9]{24}\b/gi, '/:id');
}

export function trackDailyActiveUser(userId) {
  if (!userId) {
    return;
  }

  const dateKey = utcDateKey();
  let users = activeUsersByDate.get(dateKey);

  if (!users) {
    users = new Set();
    activeUsersByDate.set(dateKey, users);
  }

  users.add(String(userId));
  setDailyActiveUsers(dateKey, users.size);

  for (const key of activeUsersByDate.keys()) {
    if (key !== dateKey) {
      activeUsersByDate.delete(key);
    }
  }
}

export function requestContextMiddleware(req, res, next) {
  const requestId = createRequestId(req.headers['x-request-id']);
  const context = { requestId };

  runWithRequestContext(context, () => {
    res.setHeader('x-request-id', requestId);

    const start = performance.now();

    res.on('finish', () => {
      const durationMs = Math.round(performance.now() - start);
      const route = normalizeRoute(req);
      const ctx = getRequestContext();

      if (req.user?._id) {
        ctx.userId = String(req.user._id);
      }

      recordHttpRequest({
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs,
      });

      logger.info('request completed', {
        method: req.method,
        path: req.originalUrl?.split('?')[0],
        route,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  });
}

export function attachUserToRequestContext(req, _res, next) {
  if (req.user?._id) {
    const ctx = getRequestContext();
    ctx.userId = String(req.user._id);
    trackDailyActiveUser(ctx.userId);
  }

  next();
}

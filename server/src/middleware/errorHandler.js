import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../observability/logger.js';
import { recordAppError } from '../observability/metrics.js';
import { recordErrorForAlerting } from '../observability/alerts.js';
import { getRequestId } from '../observability/requestContext.js';
import { captureException } from '../observability/sentry.js';

function normalizeRoute(req) {
  return req.route?.path
    ? `${req.baseUrl ?? ''}${req.route.path}`.replace(/\/+/g, '/')
    : (req.path ?? 'unknown');
}

export function errorHandler(err, req, res, _next) {
  const route = normalizeRoute(req);
  const requestId = getRequestId();

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('application error', {
        code: err.code,
        statusCode: err.statusCode,
        route,
        message: err.message,
      });
      recordAppError(err.code, route);
      recordErrorForAlerting();
      captureException(err, {
        requestId,
        userId: req.user?._id ? String(req.user._id) : undefined,
        extra: { code: err.code, route },
      });
    }

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return res.status(409).json({
      error: {
        message: `${field} is already registered`,
        code: 'CONFLICT',
      },
    });
  }

  logger.error('unhandled error', {
    route,
    message: err.message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });

  recordAppError('INTERNAL_ERROR', route);
  recordErrorForAlerting();
  captureException(err, {
    requestId,
    userId: req.user?._id ? String(req.user._id) : undefined,
    extra: { route },
  });

  const message = env.isProduction ? 'Internal server error' : err.message || 'Internal server error';

  res.status(500).json({
    error: {
      message,
      code: 'INTERNAL_ERROR',
    },
  });
}

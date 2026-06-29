import { Router } from 'express';
import { env } from '../config/env.js';
import { observabilityConfig } from '../config/observabilityConfig.js';
import { renderPrometheusMetrics } from '../observability/metrics.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function requireMetricsAccess(req, res, next) {
  if (!observabilityConfig.metricsToken) {
    if (env.isProduction) {
      return res.status(403).json({
        error: { message: 'Metrics endpoint disabled', code: 'FORBIDDEN' },
      });
    }

    return next();
  }

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.query.token;

  if (token === observabilityConfig.metricsToken) {
    return next();
  }

  return res.status(401).json({
    error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
  });
}

router.get(
  observabilityConfig.metricsPath,
  requireMetricsAccess,
  asyncHandler((_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(renderPrometheusMetrics());
  }),
);

export default router;

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import { securityConfig } from './config/securityConfig.js';
import apiRoutes from './routes/index.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { attachResolvedLanguage } from './middleware/resolveLanguageMiddleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './utils/asyncHandler.js';
import * as paymentController from './controllers/paymentController.js';
import {
  attachUserToRequestContext,
  requestContextMiddleware,
} from './observability/requestLogger.js';
import { optionalAuth } from './middleware/optionalAuth.js';
import { httpsRedirectMiddleware } from './middleware/httpsRedirect.js';
import { setupSentryExpressErrorHandler } from './observability/sentry.js';

const app = express();

if (securityConfig.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(httpsRedirectMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    hsts: env.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  }),
);
function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (origin === env.clientUrl) {
    callback(null, true);
    return;
  }

  if (env.isDevelopment) {
    const isLocalDev =
      /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin) ||
      /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(origin) ||
      /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(origin);

    if (isLocalDev) {
      callback(null, true);
      return;
    }
  }

  callback(null, false);
}

app.use(
  cors({
    origin: env.isDevelopment ? resolveCorsOrigin : env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-app-platform',
      'x-app-native-version',
      'x-app-runtime-version',
      'x-app-language',
    ],
    maxAge: 86_400,
  }),
);

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json', limit: '256kb' }),
  asyncHandler(paymentController.handleWebhook),
);

app.use(express.json({ limit: securityConfig.jsonBodyLimit }));
app.use(requestContextMiddleware);
app.use(optionalAuth);
app.use(attachUserToRequestContext);
app.use(attachResolvedLanguage);
app.use(compression());

app.use(metricsRoutes);
app.use('/api', apiRateLimiter, apiRoutes);

app.use(notFound);
setupSentryExpressErrorHandler(app);
app.use(errorHandler);

export default app;

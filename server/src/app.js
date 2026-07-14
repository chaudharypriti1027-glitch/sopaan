import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import { getSeedAdminUser } from './seed/adminConfig.js';
import { securityConfig } from './config/securityConfig.js';
import apiRoutes from './routes/index.js';
import healthRoutes from './routes/healthRoutes.js';
import mobileAppRoutes from './routes/mobileAppRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { attachResolvedLanguage } from './middleware/resolveLanguageMiddleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './utils/asyncHandler.js';
import * as paymentController from './controllers/paymentController.js';
import * as liveController from './controllers/liveController.js';
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
    contentSecurityPolicy: env.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
          },
        }
      : false,
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

app.post(
  '/api/live/egress-webhook',
  express.raw({ type: 'application/json', limit: '512kb' }),
  asyncHandler(liveController.handleEgressWebhook),
);

app.use(express.json({ limit: securityConfig.jsonBodyLimit }));
app.use(compression({ threshold: 1024 }));
app.use(requestContextMiddleware);
app.use(optionalAuth);
app.use(attachUserToRequestContext);
app.use(attachResolvedLanguage);

app.use(metricsRoutes);

// Fast public endpoints — health checks and mobile version gate (skip rate limiter).
app.use('/api', healthRoutes);
app.use('/api/app', mobileAppRoutes);

app.use('/api', apiRateLimiter, apiRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminPublicDir = path.join(__dirname, '../public/admin');
const adminIndexHtml = path.join(adminPublicDir, 'index.html');

app.get('/admin/login-hint.json', (_req, res) => {
  if (env.isProduction) {
    res.status(404).json({ email: null });
    return;
  }
  const { email } = getSeedAdminUser();
  res.json({ email });
});

app.use(
  '/admin',
  express.static(adminPublicDir, {
    index: false,
    fallthrough: true,
    maxAge: env.isProduction ? '1h' : 0,
  }),
);

app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  if (!fs.existsSync(adminIndexHtml)) {
    res.status(503).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Sopaan Admin</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem">
  <h1>Admin console not built</h1>
  <p>Build the React admin, then restart the API server:</p>
  <pre style="background:#f4f4f5;padding:1rem;border-radius:8px">npm run build:admin</pre>
  <p>For local development with hot reload, run <code>npm run dev:admin</code> and open
  <a href="http://localhost:5173">http://localhost:5173</a>.</p>
</body>
</html>`);
    return;
  }
  res.sendFile(adminIndexHtml);
});

const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir, { fallthrough: true, maxAge: env.isProduction ? '7d' : 0 }));

app.use(notFound);
setupSentryExpressErrorHandler(app);
app.use(errorHandler);

export default app;

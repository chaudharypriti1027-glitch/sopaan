import { securityConfig } from '../config/securityConfig.js';

export function httpsRedirectMiddleware(req, res, next) {
  if (!securityConfig.forceHttps) {
    return next();
  }

  const forwardedProto = req.headers['x-forwarded-proto'];

  if (forwardedProto && forwardedProto !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  return next();
}

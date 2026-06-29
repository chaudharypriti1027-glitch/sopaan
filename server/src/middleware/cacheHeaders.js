import { CACHE_HEADERS } from '../config/cacheConfig.js';

export function cacheHeaders(profile) {
  const config = CACHE_HEADERS[profile];

  if (!config) {
    return (_req, _res, next) => next();
  }

  return (_req, res, next) => {
    const visibility = config.private ? 'private' : 'public';
    const parts = [`${visibility}`, `max-age=${config.maxAge}`];

    if (config.swr) {
      parts.push(`stale-while-revalidate=${config.swr}`);
    }

    res.set('Cache-Control', parts.join(', '));
    next();
  };
}

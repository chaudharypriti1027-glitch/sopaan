import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/tokens.js';
import { isAccountSuspended } from '../utils/accountAuthPolicy.js';
import { env } from '../config/env.js';

const USER_AUTH_SELECT = '-passwordHash';
const AUTH_USER_CACHE_TTL_MS = env.isTest
  ? 0
  : Number(process.env.AUTH_USER_CACHE_TTL_MS ?? 60_000);
const MAX_AUTH_CACHE_ENTRIES = 500;

/** @type {Map<string, { user: object | null, expiresAt: number }>} */
const authUserCache = new Map();

function getCachedAuthUser(sub) {
  if (AUTH_USER_CACHE_TTL_MS <= 0) {
    return undefined;
  }

  const entry = authUserCache.get(sub);

  if (!entry) {
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    authUserCache.delete(sub);
    return undefined;
  }

  return entry.user;
}

function setCachedAuthUser(sub, user) {
  if (AUTH_USER_CACHE_TTL_MS <= 0) {
    return;
  }

  if (authUserCache.size >= MAX_AUTH_CACHE_ENTRIES) {
    const oldestKey = authUserCache.keys().next().value;
    if (oldestKey) {
      authUserCache.delete(oldestKey);
    }
  }

  authUserCache.set(sub, {
    user,
    expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS,
  });
}

export function bustAuthUserCache(userId) {
  authUserCache.delete(String(userId));
}

async function resolveAuthUser(payload) {
  const cached = getCachedAuthUser(payload.sub);

  if (cached !== undefined) {
    return cached;
  }

  const user = await User.findById(payload.sub).select(USER_AUTH_SELECT).lean();

  if (!user || user.accountStatus === 'deleted' || isAccountSuspended(user)) {
    setCachedAuthUser(payload.sub, null);
    return null;
  }

  setCachedAuthUser(payload.sub, user);
  return user;
}

/** Sets req.user (lean) when a valid bearer token is present; otherwise continues anonymously. */
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      req.user = null;
      req.auth = null;
      return next();
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await resolveAuthUser(payload);
    req.user = user;
    req.auth = user ? { sub: payload.sub, role: payload.role } : null;
    next();
  } catch {
    req.user = null;
    req.auth = null;
    next();
  }
}

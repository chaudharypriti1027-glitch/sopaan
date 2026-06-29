import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/tokens.js';

const USER_AUTH_SELECT = '-passwordHash';

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
    const user = await User.findById(payload.sub).select(USER_AUTH_SELECT).lean();
    req.user = user && user.accountStatus !== 'deleted' ? user : null;
    req.auth = req.user ? { sub: payload.sub, role: payload.role } : null;
    next();
  } catch {
    req.user = null;
    req.auth = null;
    next();
  }
}

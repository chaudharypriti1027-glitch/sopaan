import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/tokens.js';
import { AppError } from '../utils/AppError.js';
import { isAccountSuspended } from '../utils/accountAuthPolicy.js';

const USER_AUTH_SELECT = '-passwordHash';

/**
 * Require a valid Bearer access token; attach a lean user to req.user.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    if (req.user?._id?.toString() === payload.sub && req.auth?.sub === payload.sub) {
      if (req.user.accountStatus === 'deleted') {
        throw new AppError('Account has been deleted', 401, 'UNAUTHORIZED');
      }

      if (isAccountSuspended(req.user)) {
        throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
      }

      return next();
    }

    const user = await User.findById(payload.sub).select(USER_AUTH_SELECT).lean();

    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    if (user.accountStatus === 'deleted') {
      throw new AppError('Account has been deleted', 401, 'UNAUTHORIZED');
    }

    if (isAccountSuspended(user)) {
      throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = user;
    req.auth = { sub: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

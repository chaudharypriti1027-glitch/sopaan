import { AppError } from '../utils/AppError.js';
import { normalizeUserRole } from '../constants/userRoles.js';

export function requireRole(...roles) {
  const allowed = new Set(roles.map((role) => normalizeUserRole(role)));

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userRole = normalizeUserRole(req.user.role);

    if (!allowed.has(userRole)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
}

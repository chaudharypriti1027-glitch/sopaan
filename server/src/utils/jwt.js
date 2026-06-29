import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { privacyConfig } from '../config/privacyConfig.js';
import { AppError } from './AppError.js';
import { signAccess, verifyAccessToken as verifyAccess } from '../services/tokens.js';

/** @deprecated prefer tokens.signAccess(userId, role) */
export function signAccessToken(user) {
  return signAccess(user._id.toString(), user.role ?? 'student');
}

export function verifyAccessToken(token) {
  return verifyAccess(token);
}

export function signDeletionToken(userId) {
  return jwt.sign(
    { sub: userId.toString(), purpose: 'account_deletion' },
    env.jwtSecret,
    { expiresIn: `${privacyConfig.deletionTokenExpiryMin}m` },
  );
}

export function verifyDeletionToken(token, userId) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (payload.purpose !== 'account_deletion' || payload.sub !== userId.toString()) {
      throw new AppError('Invalid deletion token', 400, 'INVALID_DELETION_TOKEN');
    }

    return payload;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError('Invalid or expired deletion token', 400, 'INVALID_DELETION_TOKEN');
  }
}

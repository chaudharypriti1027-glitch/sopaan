import { OAuth2Client } from 'google-auth-library';
import { googleAuthConfig } from '../config/googleAuthConfig.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../observability/logger.js';

export async function verifyGoogleIdToken(idToken) {
  if (!googleAuthConfig.clientIds.length) {
    throw new AppError('Google sign-in is not configured on the server', 503, 'GOOGLE_AUTH_NOT_CONFIGURED');
  }

  const client = new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleAuthConfig.clientIds,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub) {
      throw new AppError('Invalid Google sign-in token', 401, 'GOOGLE_AUTH_INVALID');
    }

    return payload;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    logger.warn('google id token verification failed', { message: err.message });
    throw new AppError('Invalid Google sign-in token', 401, 'GOOGLE_AUTH_INVALID');
  }
}

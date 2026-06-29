import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function authenticateSocket(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    let payload;

    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      return next(new Error('Invalid or expired access token'));
    }

    const user = await User.findById(payload.sub).select('_id name role').lean();

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err instanceof Error ? err : new Error('Authentication failed'));
  }
}

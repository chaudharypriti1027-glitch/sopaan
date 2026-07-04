import type { Profile } from '../types/auth';

type JwtPayload = {
  role?: Profile['role'];
};

/** Decode JWT payload for display-only claims (API enforces auth server-side). */
export function readJwtPayload(token: string): JwtPayload | null {
  const segment = token.split('.')[1];
  if (!segment) {
    return null;
  }

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Backfill role from access token when older API profiles omit it. */
export function enrichProfileFromAccessToken(profile: Profile, token: string): Profile {
  if (profile.role && profile.role !== 'student') {
    return profile;
  }

  const claims = readJwtPayload(token);
  if (claims?.role === 'admin' || claims?.role === 'creator' || claims?.role === 'moderator') {
    return {
      ...profile,
      role: claims.role,
      ...(claims.role === 'admin' && profile.isPremium == null ? { isPremium: true } : {}),
    };
  }

  return profile;
}

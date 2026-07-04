import { enrichProfileFromAccessToken, readJwtPayload } from '../jwtPayload';
import type { Profile } from '../../types/auth';
import { profileToUser } from '../../auth/profileToUser';

describe('jwtPayload', () => {
  const adminPayload = Buffer.from(JSON.stringify({ sub: '1', role: 'admin' })).toString(
    'base64url',
  );
  const token = `header.${adminPayload}.sig`;

  it('reads role from access token payload', () => {
    expect(readJwtPayload(token)).toEqual({ sub: '1', role: 'admin' });
  });

  it('enriches profile role when API profile omits it', () => {
    const profile: Profile = {
      id: '1',
      name: 'Admin',
      phone: '+919999999999',
      state: '',
      targetExam: '',
      language: 'en',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const enriched = enrichProfileFromAccessToken(profile, token);
    expect(enriched.role).toBe('admin');
    expect(enriched.isPremium).toBe(true);
    expect(profileToUser(enriched).role).toBe('admin');
  });
});

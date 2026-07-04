import type { AuthResult, Profile } from '../types/auth';
import type { AuthSession, User } from '../api/types';

function profileFromLegacyUser(user: User): Profile {
  const streakCount = user.streak?.count;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone ?? '',
    ...(user.email ? { email: user.email } : {}),
    state: '',
    targetExam: '',
    language: 'en',
    createdAt: user.createdAt ?? new Date().toISOString(),
    ...(streakCount != null && streakCount > 0 ? { streak: streakCount } : {}),
    rank: null,
    level: 1,
    role: user.role ?? 'student',
    isPremium: user.isPremium ?? false,
    ...(user.premiumPlan ? { premiumPlan: user.premiumPlan } : {}),
    ...(user.premiumExpiresAt ? { premiumExpiresAt: user.premiumExpiresAt } : {}),
    coins: user.coins ?? 0,
  };
}

type LegacyAuthSession = AuthSession & {
  token?: string;
  profile?: Profile;
  isNewUser?: boolean;
};

/** Normalize legacy `{ accessToken, user }` and new `{ token, profile }` auth responses. */
export function normalizeAuthResult(data: AuthResult | LegacyAuthSession): AuthResult {
  if ('profile' in data && data.profile) {
    const legacy = data as LegacyAuthSession;

    return {
      token: legacy.token ?? legacy.accessToken,
      refreshToken: data.refreshToken,
      profile: data.profile,
      isNewUser: legacy.isNewUser ?? false,
    };
  }

  const session = data as AuthSession;

  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    profile: profileFromLegacyUser(session.user),
    isNewUser: 'isNewUser' in data ? Boolean((data as LegacyAuthSession).isNewUser) : false,
  };
}

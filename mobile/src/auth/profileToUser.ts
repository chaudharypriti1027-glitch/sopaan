import type { User } from '../api/types';
import type { Profile } from '../types/auth';

/** Map shared Profile to legacy User shape used across existing screens. */
export function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email ?? null,
    phone: profile.phone,
    role: profile.role ?? 'student',
    isPremium: profile.isPremium ?? false,
    premiumPlan: profile.premiumPlan ?? null,
    premiumExpiresAt: profile.premiumExpiresAt ?? null,
    coins: profile.coins ?? 0,
    ...(profile.streak != null && profile.streak > 0
      ? { streak: { count: profile.streak, lastActiveDate: null } }
      : {}),
    createdAt: profile.createdAt,
  };
}

export function userFromProfile(profile: Profile | null): User | null {
  return profile ? profileToUser(profile) : null;
}

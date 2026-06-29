import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { getMe } from '../api/me';
import type { AuthResult, Profile } from '../types/auth';
import { clearTokens, getTokens, saveTokens } from '../lib/secure';
import { clearMobileUser, setMobileUser } from '../observability/sentry';
import { registerSignOutHandler } from './sessionActions';

const PROFILE_CACHE_KEY = 'sopaan_profile_cache';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export type BootstrapResult =
  | { kind: 'guest' }
  | { kind: 'authed'; profile: Profile; optimistic: boolean };

type AuthStoreState = {
  profile: Profile | null;
  status: AuthStatus;
};

type AuthStoreActions = {
  setSession: (result: AuthResult) => Promise<void>;
  setProfile: (profile: Profile) => Promise<void>;
  signOut: () => Promise<void>;
  bootstrap: () => Promise<BootstrapResult>;
  refreshProfileInBackground: () => void;
};

export type AuthStore = AuthStoreState & AuthStoreActions;

async function readCachedProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

async function writeCachedProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

async function removeCachedProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}

function refreshProfileInBackground(set: (partial: Partial<AuthStoreState>) => void) {
  void getMe()
    .then(async (profile) => {
      await writeCachedProfile(profile);
      setMobileUser({ id: profile.id });
      set({ profile });
    })
    .catch(() => {
      // Keep optimistic cached profile when background refresh fails.
    });
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  profile: null,
  status: 'loading',

  setSession: async (result) => {
    await saveTokens({ token: result.token, refreshToken: result.refreshToken });
    await writeCachedProfile(result.profile);
    setMobileUser({ id: result.profile.id });
    set({ profile: result.profile, status: 'authed' });
  },

  setProfile: async (profile) => {
    await writeCachedProfile(profile);
    setMobileUser({ id: profile.id });
    set({ profile });
  },

  signOut: async () => {
    await clearTokens();
    await removeCachedProfile();
    clearMobileUser();
    set({ profile: null, status: 'guest' });
  },

  refreshProfileInBackground: () => {
    refreshProfileInBackground(set);
  },

  bootstrap: async () => {
    set({ status: 'loading' });

    const [cached, tokens] = await Promise.all([readCachedProfile(), getTokens()]);

    if (!tokens?.token) {
      await removeCachedProfile();
      set({ profile: null, status: 'guest' });
      return { kind: 'guest' };
    }

    if (cached) {
      set({ profile: cached, status: 'authed' });
      setMobileUser({ id: cached.id });
    }

    try {
      const profile = await getMe();
      await writeCachedProfile(profile);
      setMobileUser({ id: profile.id });
      set({ profile, status: 'authed' });
      return { kind: 'authed', profile, optimistic: false };
    } catch {
      if (cached) {
        set({ profile: cached, status: 'authed' });
        get().refreshProfileInBackground();
        return { kind: 'authed', profile: cached, optimistic: true };
      }

      await get().signOut();
      return { kind: 'guest' };
    }
  },
}));

registerSignOutHandler(async () => {
  await useAuthStore.getState().signOut();
});

/** Non-React access (axios interceptors, session expiry). */
export function getAuthStore(): AuthStore {
  return useAuthStore.getState();
}

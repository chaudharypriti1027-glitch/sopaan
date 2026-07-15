import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, setSessionExpiredHandler } from '../api';
import type { LoginInput, OtpRequestInput, OtpVerifyInput, SignupInput } from '../api';
import { getMe } from '../api/me';
import { queryKeys } from '../hooks/queryKeys';
import { normalizeAuthResult } from './normalizeAuthResult';
import { profileToUser, userFromProfile } from './profileToUser';
import { getAuthStore, useAuthStore } from '../store/auth';
import type { Profile } from '../types/auth';
import type { User } from '../api/types';
import { isAdminAppAccessError, openAdminConsole } from './adminPortal';
import { triggerSessionExpiredDialog } from '../components/premium/sessionExpiredDialog';
import {
  clearReferralAttribution,
  consumeReferralAttribution,
} from '../referrals/referralStorage';
import { getTokens } from '../lib/secure';

export type AuthContextValue = {
  profile: Profile | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (input: SignupInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (input: OtpRequestInput) => Promise<void>;
  verifyOtp: (input: OtpVerifyInput) => Promise<void>;
  setSessionUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const signOut = useAuthStore((state) => state.signOut);

  const user = useMemo(() => userFromProfile(profile), [profile]);
  const isAuthenticated = status === 'authed';
  const isLoading = status === 'loading';

  const logout = useCallback(async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        await authApi.logout(tokens.refreshToken);
      }
    } catch {
      // Best-effort server revocation; always clear local session.
    }

    await signOut();
    queryClient.clear();
  }, [queryClient, signOut]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void (async () => {
        await getAuthStore().signOut();
        queryClient.clear();
        triggerSessionExpiredDialog();
      })();
    });
  }, [queryClient]);

  const signup = useCallback(
    async (input: SignupInput) => {
      const attribution = await consumeReferralAttribution();
      const session = await authApi.signup({ ...input, ...attribution });
      try {
        await setSession(normalizeAuthResult(session));
      } catch (error) {
        if (isAdminAppAccessError(error)) {
          openAdminConsole(error.adminConsoleUrl);
          throw error;
        }
        throw error;
      }
      await clearReferralAttribution();
    },
    [setSession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await authApi.login(input);
      try {
        await setSession(normalizeAuthResult(session));
      } catch (error) {
        if (isAdminAppAccessError(error)) {
          openAdminConsole(error.adminConsoleUrl);
          throw error;
        }
        throw error;
      }
    },
    [setSession],
  );

  const requestOtp = useCallback(async (input: OtpRequestInput) => {
    await authApi.requestOtp(input);
  }, []);

  const verifyOtp = useCallback(
    async (input: OtpVerifyInput) => {
      const attribution = await consumeReferralAttribution();
      const session = await authApi.verifyOtp({ ...input, ...attribution });
      try {
        await setSession(normalizeAuthResult(session));
      } catch (error) {
        if (isAdminAppAccessError(error)) {
          openAdminConsole(error.adminConsoleUrl);
          throw error;
        }
        throw error;
      }
      await clearReferralAttribution();
    },
    [setSession],
  );

  const setSessionUser = useCallback(
    (nextUser: User) => {
      const current = useAuthStore.getState().profile;
      if (!current) {
        return;
      }

      void setProfile({
        ...current,
        name: nextUser.name,
        ...(nextUser.email ? { email: nextUser.email } : {}),
        coins: nextUser.coins ?? current.coins,
        ...(nextUser.streak?.count != null ? { streak: nextUser.streak.count } : {}),
        ...(typeof nextUser.isPremium === 'boolean' ? { isPremium: nextUser.isPremium } : {}),
        ...(nextUser.premiumPlan !== undefined ? { premiumPlan: nextUser.premiumPlan } : {}),
        ...(nextUser.premiumExpiresAt !== undefined
          ? { premiumExpiresAt: nextUser.premiumExpiresAt }
          : {}),
      });
    },
    [setProfile],
  );

  const refreshUser = useCallback(async () => {
    const nextProfile = await getMe();
    await setProfile(nextProfile);
    queryClient.setQueryData(queryKeys.profile.me(), {
      user: profileToUser(nextProfile),
      profile: null,
    });
  }, [queryClient, setProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      user,
      isAuthenticated,
      isLoading,
      signup,
      login,
      logout,
      requestOtp,
      verifyOtp,
      setSessionUser,
      refreshUser,
    }),
    [
      profile,
      user,
      isAuthenticated,
      isLoading,
      signup,
      login,
      logout,
      requestOtp,
      verifyOtp,
      setSessionUser,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

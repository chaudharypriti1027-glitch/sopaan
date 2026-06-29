import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { useAuthStore } from '../store/auth';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useUpdateMe } from '../hooks/useMe';
import { loadStoredLanguage } from './languageStorage';
import type { AppLanguage } from './types';
import { applyAppLanguage, syncLanguageFromProfile } from './syncLanguage';
import { invalidateLanguageQueries } from './invalidateLanguageQueries';
import { isAppLocale } from '../i18n/config';
import { useTheme } from '../theme';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const updateMe = useUpdateMe();
  const { isAuthenticated } = useAuth();
  const { data: profileData } = useProfile();
  const authProfileLanguage = useAuthStore((state) => state.profile?.language);
  const { theme } = useTheme();

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredLanguage();
      await applyAppLanguage(stored);
      setLanguageState(stored);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      return;
    }

    const prefLanguage = profileData?.profile?.preferences?.language;
    const rawLanguage =
      typeof prefLanguage === 'string' && isAppLocale(prefLanguage)
        ? prefLanguage
        : typeof authProfileLanguage === 'string' && isAppLocale(authProfileLanguage)
          ? authProfileLanguage
          : null;

    if (!rawLanguage) {
      return;
    }

    void syncLanguageFromProfile(rawLanguage).then((synced) => {
      if (synced) {
        setLanguageState(synced);
      }
    });
  }, [ready, isAuthenticated, profileData?.profile?.preferences?.language, authProfileLanguage]);

  const setLanguage = useCallback(
    async (next: AppLanguage) => {
      setLanguageState(next);
      await applyAppLanguage(next);

      if (isAuthenticated) {
        updateProfile.mutate({ preferences: { language: next } });
        updateMe.mutate({ language: next });
      }

      await invalidateLanguageQueries(queryClient);
    },
    [isAuthenticated, queryClient, updateMe, updateProfile],
  );

  const toggleLanguage = useCallback(async () => {
    const order: AppLanguage[] = ['en', 'hi', 'gu'];
    const next = order[(order.indexOf(language) + 1) % order.length];
    await setLanguage(next);
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, ready }),
    [language, setLanguage, toggleLanguage, ready],
  );

  if (!ready) {
    return (
      <View style={[bootStyles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

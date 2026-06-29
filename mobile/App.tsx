import { useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import './src/i18n';
import { AuthProvider } from './src/auth';
import { ExperimentsProvider } from './src/experiments';
import { OfflineBanner } from './src/components/OfflineBanner';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useNotificationDeepLink } from './src/hooks/useNotificationDeepLink';
import { useReferralDeepLink } from './src/hooks/useReferralDeepLink';
import { bootstrapReferralInstallTracking } from './src/referrals/referralStorage';
import { useSocketConnection } from './src/hooks/useSocket';
import { LanguageProvider } from './src/language/LanguageContext';
import { AppErrorBoundary } from './src/errors/AppErrorBoundary';
import { ReleaseGate } from './src/updates/ReleaseGate';
import { RootNavigator } from './src/navigation/RootNavigator';
import { createPersistedQueryClient, persistOptions } from './src/query/persistClient';
import {
  ThemeProvider,
  buildNavigationTheme,
  criticalFontAssets,
  statFontAssets,
  useTheme,
} from './src/theme';

SplashScreen.preventAutoHideAsync();

function NavigationShell() {
  usePushNotifications();
  useNotificationDeepLink();
  useReferralDeepLink();
  useSocketConnection();

  return (
    <>
      <OfflineBanner />
      <RootNavigator />
    </>
  );
}

function AppNavigation() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={buildNavigationTheme(theme)}>
      <NavigationShell />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

function AppProviders() {
  const queryClient = useMemo(() => createPersistedQueryClient(), []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <ReleaseGate>
          <AuthProvider>
            <ExperimentsProvider>
              <LanguageProvider>
                <AppNavigation />
              </LanguageProvider>
            </ExperimentsProvider>
          </AuthProvider>
        </ReleaseGate>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

export default function App() {
  const [criticalLoaded, criticalError] = useFonts(criticalFontAssets);
  useFonts(statFontAssets);

  useEffect(() => {
    void bootstrapReferralInstallTracking();
  }, []);

  useEffect(() => {
    if (criticalLoaded || criticalError) {
      SplashScreen.hideAsync();
    }
  }, [criticalLoaded, criticalError]);

  if (!criticalLoaded && !criticalError) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AppProviders />
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
  },
});

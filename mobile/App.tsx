import { useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import './src/i18n';
import { WebAppShell } from './src/layout/WebAppShell';
import { bootstrapWebDocument } from './src/layout/webBootstrap';
import { AuthProvider } from './src/auth';
import { ExperimentsProvider } from './src/experiments';
import { OfflineBanner } from './src/components/OfflineBanner';
import { PremiumDialogProvider } from './src/components/premium/PremiumDialogProvider';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useNotificationDeepLink } from './src/hooks/useNotificationDeepLink';
import { useReferralDeepLink } from './src/hooks/useReferralDeepLink';
import { bootstrapReferralInstallTracking } from './src/referrals/referralStorage';
import { useSocketConnection } from './src/hooks/useSocket';
import { useRealtimeInbox } from './src/hooks/useRealtimeInbox';
import { LanguageProvider } from './src/language/LanguageContext';
import { AppErrorBoundary } from './src/errors/AppErrorBoundary';
import { ReleaseGate } from './src/updates/ReleaseGate';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthNavigationGuard } from './src/navigation/AuthNavigationGuard';
import { navigationRef } from './src/navigation/navigationRef';
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
  useRealtimeInbox();

  return (
    <>
      <AuthNavigationGuard />
      <OfflineBanner />
      <RootNavigator />
    </>
  );
}

function AppNavigation() {
  const { theme } = useTheme();

  return (
    <NavigationContainer ref={navigationRef} theme={buildNavigationTheme(theme)}>
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
          <PremiumDialogProvider>
            <AppErrorBoundary>
              <AuthProvider>
                <LanguageProvider>
                  <ExperimentsProvider>
                    <AppNavigation />
                  </ExperimentsProvider>
                </LanguageProvider>
              </AuthProvider>
            </AppErrorBoundary>
          </PremiumDialogProvider>
        </ReleaseGate>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

export default function App() {
  const [criticalLoaded, criticalError] = useFonts(criticalFontAssets);
  useFonts(statFontAssets);

  useEffect(() => {
    bootstrapWebDocument();
  }, []);

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
        <WebAppShell>
          <AppProviders />
        </WebAppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : null),
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
  },
});

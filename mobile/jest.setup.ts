import '@testing-library/jest-native/extend-expect';
import './src/i18n';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};

  const enteringChain = {
    delay: () => enteringChain,
    duration: () => enteringChain,
    reduceMotion: () => undefined,
  };

  return {
    ...Reanimated,
    useReducedMotion: jest.fn(() => false),
    ReduceMotion: { System: 'system' },
    FadeInDown: enteringChain,
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-updates', () => ({
  isEnabled: false,
  channel: 'test',
  updateId: null,
  isEmbeddedLaunch: true,
  checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(async () => undefined),
  reloadAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '0.1.0',
  nativeBuildVersion: '1',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('./src/api/appConfig', () => ({
  fetchVersionRequirements: jest.fn(async () => ({
    minNativeVersion: '0.1.0',
    latestNativeVersion: '0.1.0',
    updateChannel: 'test',
    forceUpdate: false,
    forceUpdateTitle: 'Update required',
    forceUpdateMessage: 'Please update',
    storeUrl: 'https://example.com',
    platform: 'ios',
    clientNativeVersion: '0.1.0',
    checkedAt: new Date().toISOString(),
  })),
}));

jest.mock('./src/language/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLanguage: () => ({
    language: 'en' as const,
    setLanguage: jest.fn(async () => undefined),
    toggleLanguage: jest.fn(async () => undefined),
    ready: true,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('./src/components/profile/avatarStorage', () => ({
  loadAvatarPreset: jest.fn(async () => null),
  saveAvatarPreset: jest.fn(async () => undefined),
  clearAvatarPreset: jest.fn(async () => undefined),
}));

jest.mock('./src/components/profile/useAvatarSelection', () => {
  const { resolveAvatarDisplay } = jest.requireActual('./src/components/profile/avatarDisplay');

  return {
    useAvatarSelection: ({
      name,
      avatarUrl,
    }: {
      userId?: string;
      name?: string;
      avatarUrl?: string | null;
    }) => ({
      display: resolveAvatarDisplay({ name, avatarUrl, presetId: null }),
      presetId: null,
      applyPreset: jest.fn(async () => undefined),
      clearPreset: jest.fn(async () => undefined),
    }),
  };
});

jest.mock('./src/components/profile/LiveAvatarMotion', () => ({
  LiveAvatarMotion: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./src/components/profile/PersonAvatarArt', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    PersonAvatarArt: () => React.createElement(View, { testID: 'person-avatar-art-mock' }),
  };
});

jest.mock('./src/components/profile/BlinkingEye', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Reanimated = require('react-native-reanimated/mock');

  function BlinkingEye({ size, iris }: { size: number; iris: string }) {
    const w = Math.max(7, Math.round(size * 0.075));
    const h = Math.max(8, Math.round(size * 0.09));
    return React.createElement(
      View,
      {
        style: {
          width: w,
          height: h,
          borderRadius: h * 0.42,
          backgroundColor: '#F8F6F2',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      React.createElement(View, {
        style: {
          width: w * 0.55,
          height: w * 0.55,
          borderRadius: w * 0.28,
          backgroundColor: iris,
        },
      }),
    );
  }

  return {
    BlinkingEye,
    useAvatarBlink: () => Reanimated.useSharedValue(0),
  };
});

jest.mock('./src/observability/sentry', () => ({
  initMobileObservability: jest.fn(() => false),
  captureMobileException: jest.fn(),
  setMobileUser: jest.fn(),
  clearMobileUser: jest.fn(),
}));

jest.mock('./src/perf/useScreenPerf', () => ({
  useScreenPerf: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn(async () => ({ type: 'cancel' }))],
}));

jest.mock('@sentry/react-native', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  init: jest.fn(),
}));

afterEach(() => {
  jest.clearAllTimers();
});

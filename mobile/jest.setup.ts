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

jest.mock('./src/observability/sentry', () => ({
  initMobileObservability: jest.fn(() => false),
  captureMobileException: jest.fn(),
  setMobileUser: jest.fn(),
  clearMobileUser: jest.fn(),
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

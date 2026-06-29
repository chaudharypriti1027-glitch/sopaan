import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../store/auth';

jest.mock('../../api/auth', () => ({
  signup: jest.fn(),
  login: jest.fn(),
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../api/client', () => ({
  setSessionExpiredHandler: jest.fn(),
}));

jest.mock('../../lib/secure', () => ({
  saveTokens: jest.fn(async () => undefined),
  getTokens: jest.fn(async () => null),
  clearTokens: jest.fn(async () => undefined),
  getAccessToken: jest.fn(async () => null),
  hasStoredSession: jest.fn(async () => false),
}));

const mockProfile = {
  id: 'user_1',
  name: 'Test User',
  phone: '+919876543210',
  email: 'test@example.com',
  state: 'Gujarat',
  targetExam: 'SSC CGL',
  language: 'en' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  rank: null,
  level: 1,
  coins: 0,
  onboardingComplete: true,
};

describe('AuthProvider', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useAuthStore.setState({ profile: null, status: 'guest' });
  });

  it('logs in and stores the session profile', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { saveTokens } = jest.requireMock('../../lib/secure') as { saveTokens: jest.Mock };

    (authApi.login as jest.Mock).mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      profile: mockProfile,
      isNewUser: false,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.login({
        phone: '+919876543210',
        password: 'password123',
      });
    });

    expect(authApi.login).toHaveBeenCalledWith({
      phone: '+919876543210',
      password: 'password123',
    });
    expect(saveTokens).toHaveBeenCalledWith({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.profile?.name).toBe('Test User');
  });

  it('logs out and clears tokens', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { clearTokens } = jest.requireMock('../../lib/secure') as { clearTokens: jest.Mock };

    (authApi.login as jest.Mock).mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      profile: mockProfile,
      isNewUser: false,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.login({ phone: '+919876543210', password: 'password123' });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(clearTokens).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.profile).toBeNull();
  });
});

import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { renderWithProviders } from '../../test/render';

const mockNavigate = jest.fn();
const mockRequestOtp = jest.fn();
const mockLogin = jest.fn();
const mockSetSession = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
  }),
}));

jest.mock('../../auth/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({
    signInWithGoogle: jest.fn(),
    loading: false,
    isConfigured: false,
  }),
}));

jest.mock('../../api', () => ({
  authApi: {
    requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
    login: (...args: unknown[]) => mockLogin(...args),
  },
  privacyApi: {
    getPolicy: jest.fn().mockResolvedValue({ version: '2025-06-01' }),
  },
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Something went wrong',
  }),
}));

jest.mock('../../store/auth', () => ({
  useAuthStore: Object.assign(
    (selector: (state: { setSession: typeof mockSetSession; profile: null }) => unknown) =>
      selector({ setSession: mockSetSession, profile: null }),
    {
      getState: () => ({
        setSession: mockSetSession,
        profile: {
          id: '1',
          name: 'Test',
          phone: '+919876543210',
          state: 'GJ',
          targetExam: 'SSC',
          language: 'en',
          createdAt: '',
          onboardingComplete: true,
        },
      }),
    },
  ),
}));

jest.mock('../../auth/routeAfterSession', () => ({
  routeAfterSession: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestOtp.mockResolvedValue({ sent: true });
    mockLogin.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      profile: { id: '1', name: 'Test', phone: '+919876543210', state: 'GJ', targetExam: 'SSC', language: 'en', createdAt: '', onboardingComplete: true },
      isNewUser: false,
    });
    mockSetSession.mockResolvedValue(undefined);
  });

  it('keeps Send OTP disabled until phone is valid', () => {
    const { getByTestId, getByRole } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByRole('tab', { name: 'Phone' }));
    fireEvent.changeText(getByTestId('login-phone'), '123');
    fireEvent.press(getByRole('button', { name: 'Send OTP' }));

    expect(mockRequestOtp).not.toHaveBeenCalled();
  });

  it('requests OTP and navigates to Otp screen', async () => {
    const { getByTestId, getByRole } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByRole('tab', { name: 'Phone' }));
    fireEvent.changeText(getByTestId('login-phone'), '9876543210');
    fireEvent.press(getByRole('button', { name: 'Send OTP' }));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith({ phone: '+919876543210' });
      expect(mockNavigate).toHaveBeenCalledWith('Otp', { phone: '+919876543210' });
    });
  });

  it('reveals password mode and submits login', async () => {
    const { getByTestId, getByRole } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByRole('tab', { name: 'Phone' }));
    fireEvent.changeText(getByTestId('login-phone'), '9876543210');
    fireEvent.press(getByRole('button', { name: 'Use password instead' }));
    fireEvent.changeText(getByTestId('login-password'), 'Password1');
    fireEvent.press(getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phone: '+919876543210',
        password: 'Password1',
      });
      expect(mockSetSession).toHaveBeenCalled();
    });
  });

  it('logs in with email and password', async () => {
    const { getByTestId, getByRole } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByTestId('login-email'), 'user@example.com');
    fireEvent.changeText(getByTestId('login-password'), 'Password1');
    fireEvent.press(getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password1',
      });
    });
  });

  it('navigates to create account', () => {
    const { getByTestId } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByTestId('login-create-account'));

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
  });
});

import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { renderWithProviders } from '../../test/render';

const mockNavigate = jest.fn();
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

async function renderLogin() {
  const result = renderWithProviders(<LoginScreen />);
  await waitFor(() => {
    expect(jest.requireMock('../../api').privacyApi.getPolicy).toHaveBeenCalled();
  });
  return result;
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
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
      isNewUser: false,
    });
    mockSetSession.mockResolvedValue(undefined);
  });

  it('navigates to phone/OTP login when the Phone option is pressed', async () => {
    const { getByRole } = await renderLogin();

    fireEvent.press(getByRole('button', { name: 'Phone' }));

    expect(mockNavigate).toHaveBeenCalledWith('OtpLogin');
  });

  it('shows a forgot password link', async () => {
    const { getByTestId } = await renderLogin();
    expect(getByTestId('login-forgot-password')).toBeTruthy();
  });

  it('keeps Sign in disabled until email and password are valid', async () => {
    const { getByTestId, getByRole } = await renderLogin();

    fireEvent.changeText(getByTestId('login-email'), 'bad');
    fireEvent.changeText(getByTestId('login-password'), 'short');
    expect(getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('logs in with email and password', async () => {
    const { getByTestId, getByRole } = await renderLogin();

    fireEvent.changeText(getByTestId('login-email'), 'user@example.com');
    fireEvent.changeText(getByTestId('login-password'), 'Password123!');
    fireEvent.press(getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!',
      });
      expect(mockSetSession).toHaveBeenCalled();
    });
  });

  it('navigates to create account', async () => {
    const { getByTestId } = await renderLogin();

    fireEvent.press(getByTestId('login-create-account'));

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
  });
});

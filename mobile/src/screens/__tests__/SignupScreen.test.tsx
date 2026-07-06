import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { SignupScreen } from '../SignupScreen';
import { renderWithProviders } from '../../test/render';
import type { Profile } from '../../types/auth';

const mockNavigate = jest.fn();
const mockUpdateMe = jest.fn();
const mockSetProfile = jest.fn();
const mockSignup = jest.fn();
const mockRouteAfterSession = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../auth/routeAfterSession', () => ({
  routeAfterSession: (...args: unknown[]) => mockRouteAfterSession(...args),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

const profile = {
  id: '1',
  name: 'Student',
  phone: '+919876543210',
  state: '',
  targetExam: '',
  language: 'en' as const,
  createdAt: '',
};

const authStoreState: {
  profile: Profile | null;
  status: 'authed' | 'guest';
} = {
  profile,
  status: 'authed',
};

jest.mock('../../store/auth', () => {
  const hook = (selector: (state: {
    profile: Profile | null;
    setProfile: typeof mockSetProfile;
    status: 'authed' | 'guest';
  }) => unknown) =>
    selector({
      profile: authStoreState.profile,
      setProfile: mockSetProfile,
      status: authStoreState.status,
    });

  hook.getState = () => ({
    profile: authStoreState.profile,
  });

  return { useAuthStore: hook };
});

jest.mock('../../api', () => ({
  meApi: {
    updateMe: (...args: unknown[]) => mockUpdateMe(...args),
  },
  privacyApi: {
    getPolicy: jest.fn(async () => ({ version: '2025-06-01' })),
  },
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Request failed',
    code: 'REQUEST_FAILED',
    status: 400,
  }),
}));

jest.mock('../../auth/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({
    signInWithGoogle: jest.fn(),
    loading: false,
    isConfigured: false,
  }),
}));

describe('SignupScreen post-OTP completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreState.status = 'authed';
    authStoreState.profile = { ...profile, name: 'Student', phone: '+919876543210' };
    mockUpdateMe.mockResolvedValue({
      ...profile,
      name: 'Arjun Patel',
      email: 'arjun@example.com',
    });
    mockSetProfile.mockResolvedValue(undefined);
  });

  it('shows verified phone chip', () => {
    const { getByText } = renderWithProviders(<SignupScreen />);
    expect(getByText('+91 98765 43210')).toBeTruthy();
    expect(getByText('Verified')).toBeTruthy();
  });

  it('saves name via PUT /api/me and navigates to ProfileSetup', async () => {
    const { getByTestId, getByRole } = renderWithProviders(<SignupScreen />);

    fireEvent.changeText(getByTestId('signup-name'), 'Arjun Patel');
    fireEvent.changeText(getByTestId('signup-email'), 'arjun@example.com');

    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Continue' }));
    });

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith({
        name: 'Arjun Patel',
        email: 'arjun@example.com',
      });
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Arjun Patel', email: 'arjun@example.com' }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('ProfileSetup');
    });
  });

  it('requires a name before continuing', async () => {
    const { getByRole } = renderWithProviders(<SignupScreen />);

    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Continue' }));
    });

    expect(mockUpdateMe).not.toHaveBeenCalled();
  });
});

describe('SignupScreen email registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreState.status = 'guest';
    authStoreState.profile = null;
    mockSignup.mockImplementation(async () => {
      authStoreState.status = 'authed';
      authStoreState.profile = {
        id: '2',
        name: 'New User',
        email: 'new@example.com',
        phone: '',
        state: '',
        targetExam: '',
        language: 'en' as const,
        createdAt: '',
        onboardingComplete: false,
      };
    });
  });

  it('routes to profile setup after creating an email account', async () => {
    const { getByTestId } = renderWithProviders(<SignupScreen />);

    fireEvent.changeText(getByTestId('signup-name-field'), 'New User');
    fireEvent.changeText(getByTestId('signup-email-field'), 'new@example.com');
    fireEvent.changeText(getByTestId('signup-password-field'), 'Password123!');
    fireEvent.press(getByTestId('consent-policy'));
    fireEvent.press(getByTestId('signup-create-account'));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
      expect(mockRouteAfterSession).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'New User',
          email: 'new@example.com',
          onboardingComplete: false,
        }),
      );
    });
  });
});

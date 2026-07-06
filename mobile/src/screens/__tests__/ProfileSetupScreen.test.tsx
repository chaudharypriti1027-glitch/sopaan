import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileSetupScreen } from '../ProfileSetupScreen';
import { renderWithProviders } from '../../test/render';
import type { Profile } from '../../types/auth';

const mockDispatch = jest.fn();
const mockSetAppLanguage = jest.fn();
const mockUpdateMe = jest.fn();
const mockUploadAvatar = jest.fn();
const mockSetProfile = jest.fn();
const mockRouteAfterSession = jest.fn();
const mockCompleteOnboarding = jest.fn();

jest.mock('../../auth/routeAfterSession', () => ({
  routeAfterSession: (...args: unknown[]) => mockRouteAfterSession(...args),
}));

jest.mock('../../auth/OnboardingContext', () => ({
  useOnboarding: () => ({
    completeOnboarding: mockCompleteOnboarding,
  }),
}));
const mockPickImageAsset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

jest.mock('../../language/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en' as const,
    setLanguage: (...args: unknown[]) => mockSetAppLanguage(...args),
    toggleLanguage: jest.fn(async () => undefined),
    ready: true,
  }),
}));

jest.mock('../../utils/imagePicker', () => ({
  pickImageAsset: (...args: unknown[]) => mockPickImageAsset(...args),
}));

jest.mock('../../api', () => ({
  meApi: {
    updateMe: (...args: unknown[]) => mockUpdateMe(...args),
    uploadAvatar: (...args: unknown[]) => mockUploadAvatar(...args),
  },
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Request failed',
    code: 'REQUEST_FAILED',
    status: 400,
  }),
}));

const mockProfileState: {
  profile: Profile;
} = {
  profile: {
    id: '1',
    name: 'Arjun Patel',
    phone: '+919876543210',
    state: '',
    targetExam: '',
    language: 'en' as const,
    createdAt: '',
  },
};

jest.mock('../../store/auth', () => ({
  useAuthStore: (selector: (state: { profile: typeof mockProfileState.profile; setProfile: typeof mockSetProfile }) => unknown) =>
    selector({ profile: mockProfileState.profile, setProfile: mockSetProfile }),
}));

describe('ProfileSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompleteOnboarding.mockResolvedValue(undefined);
    mockProfileState.profile = {
      id: '1',
      name: 'Arjun Patel',
      phone: '+919876543210',
      state: '',
      targetExam: '',
      language: 'en',
      createdAt: '',
    };
    mockUpdateMe.mockImplementation(async (input: Record<string, unknown>) => {
      mockProfileState.profile = {
        ...mockProfileState.profile,
        ...input,
        onboardingComplete: Boolean(
          mockProfileState.profile.name?.trim() &&
            String(input.state ?? mockProfileState.profile.state).trim() &&
            String(input.targetExam ?? mockProfileState.profile.targetExam).trim(),
        ),
      };
      return mockProfileState.profile;
    });
    mockSetProfile.mockResolvedValue(undefined);
    mockSetAppLanguage.mockImplementation(async (language: 'en' | 'hi' | 'gu') => {
      mockProfileState.profile = {
        ...mockProfileState.profile,
        language,
      };
    });
    mockPickImageAsset.mockResolvedValue(null);
  });

  it('persists goal on Next and moves to the You step', async () => {
    const { getByTestId, getByText } = renderWithProviders(<ProfileSetupScreen />);

    fireEvent.press(getByTestId('exam-chip-ssc'));

    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-next'));
    });

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith({
        targetExam: 'SSC CGL',
        examDate: null,
      });
      expect(getByText('About you')).toBeTruthy();
    });
  });

  it('requires state before leaving the You step', async () => {
    const { getByTestId, getByText } = renderWithProviders(<ProfileSetupScreen />);

    fireEvent.press(getByTestId('exam-chip-banking'));
    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-next'));
    });

    await waitFor(() => getByText('About you'));

    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-next'));
    });

    expect(mockUpdateMe).toHaveBeenCalledTimes(1);
  });

  it('finishes onboarding with language and routes home', async () => {
    const { getByTestId, getByText } = renderWithProviders(<ProfileSetupScreen />);

    fireEvent.press(getByTestId('exam-chip-railway'));
    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-next'));
    });

    await waitFor(() => getByText('About you'));

    fireEvent.press(getByTestId('profile-setup-state'));
    fireEvent.press(getByTestId('state-row-gujarat'));

    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-next'));
    });

    await waitFor(() => getByText('App language'));

    fireEvent.press(getByTestId('language-card-hi'));

    await act(async () => {
      fireEvent.press(getByTestId('profile-setup-finish'));
    });

    await waitFor(() => {
      expect(mockSetAppLanguage).toHaveBeenLastCalledWith('hi');
      expect(mockUpdateMe).toHaveBeenLastCalledWith({ language: 'hi' });
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(mockRouteAfterSession).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          targetExam: 'RRB NTPC',
          state: 'Gujarat',
          language: 'hi',
        }),
      );
    });
  });
});

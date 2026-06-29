import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { SignupScreen } from '../SignupScreen';
import { renderWithProviders } from '../../test/render';

const mockNavigate = jest.fn();
const mockUpdateMe = jest.fn();
const mockSetProfile = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../api', () => ({
  meApi: {
    updateMe: (...args: unknown[]) => mockUpdateMe(...args),
  },
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Request failed',
    code: 'REQUEST_FAILED',
    status: 400,
  }),
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

jest.mock('../../store/auth', () => ({
  useAuthStore: (selector: (state: { profile: typeof profile; setProfile: typeof mockSetProfile; status: 'authed' }) => unknown) =>
    selector({ profile, setProfile: mockSetProfile, status: 'authed' }),
}));

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

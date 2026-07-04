import { fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { renderWithProviders } from '../../test/render';

const mockNavigate = jest.fn();
const mockGetParent = jest.fn();
const mockLogout = jest.fn();
const mockResetToLogin = jest.fn();
const mockUpdateMe = jest.fn();

const mockProfile = {
  id: '1',
  name: 'Arjun Patel',
  phone: '+919876543210',
  state: 'Gujarat',
  category: 'GEN' as const,
  targetExam: 'SSC CGL',
  examDate: '2026-03-15',
  language: 'en' as const,
  educationLevel: 'Graduate' as const,
  streak: 12,
  rank: 48,
  level: 3,
  coins: 420,
  createdAt: '',
};

const mockMeQuery: {
  data: typeof mockProfile | undefined;
  isLoading: boolean;
  isFetching: boolean;
} = {
  data: mockProfile,
  isLoading: false,
  isFetching: false,
};

const mockSummary = {
  courses: 2,
  savedQuestions: 24,
  mistakes: 12,
  achievements: 9,
  coins: 420,
  downloads: 3,
  rank: 48,
  streak: 12,
  level: 3,
};

const mockSummaryQuery: {
  data: typeof mockSummary | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: jest.Mock;
} = {
  data: mockSummary,
  isLoading: false,
  isFetching: false,
  refetch: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    getParent: mockGetParent,
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
  },
}));

jest.mock('../../auth/routeAfterSession', () => ({
  resetToLogin: (...args: unknown[]) => mockResetToLogin(...args),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

jest.mock('../../hooks', () => ({
  useMe: () => mockMeQuery,
  useProfileSummary: () => mockSummaryQuery,
  useUpdateMe: () => ({
    mutateAsync: (...args: unknown[]) => mockUpdateMe(...args),
    isPending: false,
  }),
}));

jest.mock('../../api', () => ({
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Request failed',
    code: 'REQUEST_FAILED',
    status: 400,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetParent.mockReturnValue({ navigate: mockNavigate });
    mockLogout.mockResolvedValue(undefined);
    mockUpdateMe.mockResolvedValue({
      ...mockProfile,
      targetExam: 'IBPS PO',
    });
    mockMeQuery.data = { ...mockProfile };
    mockMeQuery.isFetching = false;
    mockSummaryQuery.data = { ...mockSummary };
    mockSummaryQuery.isLoading = false;
  });

  it('renders cached account details immediately', () => {
    const { getByText, getByTestId } = renderWithProviders(<ProfileScreen />);

    expect(getByText('Arjun Patel')).toBeTruthy();
    expect(getByText(/verified/i)).toBeTruthy();
    expect(getByTestId('profile-detail-target-exam')).toBeTruthy();
    expect(getByText(/SSC CGL/)).toBeTruthy();
    expect(getByText('Gujarat')).toBeTruthy();
    expect(getByText('Graduate')).toBeTruthy();
    expect(getByText('48')).toBeTruthy();
    expect(getByText('Day streak')).toBeTruthy();
    expect(getByText('Coins')).toBeTruthy();
  });

  it('renders live menu counts from profile summary', () => {
    const { getByTestId } = renderWithProviders(<ProfileScreen />);

    expect(getByTestId('profile-count-courses')).toHaveTextContent('2');
    expect(getByTestId('profile-count-saved')).toHaveTextContent('24');
    expect(getByTestId('profile-count-mistakes')).toHaveTextContent('12');
    expect(getByTestId('profile-count-badges')).toHaveTextContent('9');
    expect(getByTestId('profile-count-wallet')).toHaveTextContent('420');
  });

  it('opens edit sheet and saves via PUT /api/me', async () => {
    const { getByTestId } = renderWithProviders(<ProfileScreen />);

    fireEvent.press(getByTestId('profile-edit'));
    fireEvent.press(getByTestId('edit-profile-save'));

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Arjun Patel',
          targetExam: 'SSC CGL',
          state: 'Gujarat',
          language: 'en',
        }),
      );
    });
  });

  it('routes to settings from footer', () => {
    const { getByTestId } = renderWithProviders(<ProfileScreen />);

    fireEvent.press(getByTestId('profile-settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('shows sign-in prompt when profile is missing', () => {
    mockMeQuery.data = undefined;

    const { getByText } = renderWithProviders(<ProfileScreen />);

    expect(getByText(/sign in to view your profile/i)).toBeTruthy();
  });

  it('shows skeleton counts while summary is loading', () => {
    mockSummaryQuery.isLoading = true;
    mockSummaryQuery.data = undefined;

    const { queryByTestId } = renderWithProviders(<ProfileScreen />);

    expect(queryByTestId('profile-count-courses')).toBeNull();
    expect(queryByTestId('profile-count-saved')).toBeNull();
  });

  it('navigates to premium from pro card', () => {
    const { getByLabelText } = renderWithProviders(<ProfileScreen />);

    fireEvent.press(getByLabelText('Upgrade to Sopaan Pro'));
    expect(mockNavigate).toHaveBeenCalledWith('Premium');
  });
});

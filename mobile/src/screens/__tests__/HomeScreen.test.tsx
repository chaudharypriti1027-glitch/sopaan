import { waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { getHomeFeed } from '../../api/home';
import { createTestQueryClient, renderWithProviders } from '../../test/render';
import { createMockHomeFeed } from '../../test/fixtures/homeFeed';

const mockGetParent = jest.fn(() => ({ navigate: jest.fn() }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    getParent: mockGetParent,
  }),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../api/home', () => ({
  getHomeFeed: jest.fn(),
  refreshHomeFeed: jest.fn(),
}));

jest.mock('../../perf', () => ({
  useScreenPerf: jest.fn(),
}));

jest.mock('../../hooks/useProGate', () => ({
  useProGate: () => ({
    isPro: false,
    openPaywall: jest.fn(),
    showAds: true,
    isLoading: false,
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockedGetHomeFeed = getHomeFeed as jest.MockedFunction<typeof getHomeFeed>;

function sectionOrder(screen: ReturnType<typeof renderWithProviders>) {
  return screen
    .getAllByTestId(/^home-section-/)
    .map((node) => node.props.testID as string);
}

describe('HomeScreen integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feed sections in order from GET /home', async () => {
    const feed = createMockHomeFeed();
    mockedGetHomeFeed.mockResolvedValue(feed);

    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Priya')).toBeTruthy();
      expect(screen.getByText(/Good morning/)).toBeTruthy();
    });

    expect(sectionOrder(screen)).toEqual([
      'home-section-greeting',
      'home-section-countdown',
      'home-section-streak',
      'home-section-features',
      'home-section-explore-shortcuts',
      'home-section-daily-challenge',
      'home-section-continue',
      'home-section-recommended',
      'home-section-affairs',
      'home-section-nudges',
      'home-section-nudge-nudge-weak-topic',
      'home-section-league',
    ]);

    expect(mockedGetHomeFeed).toHaveBeenCalledTimes(1);
  });

  it('renders AI coach when nudges are empty', async () => {
    const feed = createMockHomeFeed({ aiNudges: [] });
    mockedGetHomeFeed.mockResolvedValue(feed);

    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('home-section-nudges')).toBeTruthy();
      expect(screen.getByTestId('home-ai-coach-card')).toBeTruthy();
      expect(screen.getByTestId('home-ask-ai-cta')).toBeTruthy();
    });
  });

  it('renders no continue section or header when continue is empty', async () => {
    const feed = createMockHomeFeed({ continue: [] });
    mockedGetHomeFeed.mockResolvedValue(feed);

    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('home-section-streak')).toBeTruthy();
    });

    expect(screen.queryByTestId('home-section-continue')).toBeNull();
    expect(screen.queryByText('Continue')).toBeNull();
    expect(screen.queryByText('Continue learning')).toBeNull();
  });

  it('shows cached feed with offline banner when fetch fails', async () => {
    const feed = createMockHomeFeed();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['home'], feed);

    const cached = queryClient.getQueryCache().find({ queryKey: ['home'] });
    if (cached) {
      cached.setState({
        ...cached.state,
        data: feed,
        dataUpdatedAt: 0,
        status: 'success',
        fetchStatus: 'idle',
      });
    }

    mockedGetHomeFeed.mockRejectedValue(new Error('Network request failed'));

    const screen = renderWithProviders(<HomeScreen />, { queryClient });

    await waitFor(() => {
      expect(mockedGetHomeFeed).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-offline-banner')).toBeTruthy();
    });

    expect(screen.getByText('Offline — showing saved')).toBeTruthy();
    expect(screen.getByText(/Good morning/)).toBeTruthy();
    expect(screen.queryByText("Couldn't load your home")).toBeNull();
  });
});

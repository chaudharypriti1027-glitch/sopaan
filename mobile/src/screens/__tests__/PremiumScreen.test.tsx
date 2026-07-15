import { fireEvent, waitFor } from '@testing-library/react-native';
import { PremiumScreen } from '../app/PremiumScreen';
import { renderWithProviders } from '../../test/render';
import { MOCK_PREMIUM_PLANS } from '../../test/fixtures/stackScreens';

const mockNavigate = jest.fn();
const mockSetSessionUser = jest.fn();
const mockRefreshUser = jest.fn();
const mockTrackEvent = jest.fn();
const mockCheckout = jest.fn();
const mockStartTrial = jest.fn();
const mockRefetchEntitlement = jest.fn();

const mockPlansQuery: {
  data: typeof MOCK_PREMIUM_PLANS | undefined;
  isLoading: boolean;
} = {
  data: MOCK_PREMIUM_PLANS,
  isLoading: false,
};

const mockEntitlementQuery = {
  data: {
    entitlement: {
      status: 'active',
      plan: 'yearly',
      currentPeriodEnd: '2026-12-31T00:00:00.000Z',
    },
  },
  isLoading: false,
  refetch: mockRefetchEntitlement,
};

const mockAuthUser = {
  name: 'Arjun Patel',
  email: 'arjun@example.com',
  phone: '+919876543210',
  isPremium: false,
  premiumExpiresAt: null as string | null,
  premiumPlan: null as string | null,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: undefined,
  }),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    setSessionUser: mockSetSessionUser,
    refreshUser: mockRefreshUser,
  }),
}));

jest.mock('../../experiments', () => ({
  useExperiments: () => ({
    payloads: require('../../experiments/defaults').DEFAULT_EXPERIMENT_PAYLOADS,
    trackEvent: mockTrackEvent,
  }),
}));

jest.mock('../../hooks', () => ({
  usePremiumPlans: () => mockPlansQuery,
  useSubscriptionEntitlement: () => mockEntitlementQuery,
  useProGate: () => ({
    tier: { welcomeMonthEnabled: true },
    isPro: false,
    refetchTier: jest.fn(),
  }),
}));

jest.mock('../../payments/subscriptionFlow', () => ({
  checkoutPremiumPlan: (...args: unknown[]) => mockCheckout(...args),
  startFreeTrial: (...args: unknown[]) => mockStartTrial(...args),
}));

jest.mock('../../api', () => ({
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Request failed',
    code: 'REQUEST_FAILED',
    status: 400,
  }),
}));

describe('PremiumScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser.isPremium = false;
    mockAuthUser.premiumExpiresAt = null;
    mockAuthUser.premiumPlan = null;
    mockPlansQuery.isLoading = false;
    mockPlansQuery.data = MOCK_PREMIUM_PLANS;
    mockCheckout.mockResolvedValue({
      user: {
        ...mockAuthUser,
        isPremium: true,
        premiumPlan: 'yearly',
        premiumExpiresAt: '2027-07-14T00:00:00.000Z',
      },
      plan: 'yearly',
    });
    mockStartTrial.mockResolvedValue({
      ...mockAuthUser,
      isPremium: true,
      premiumPlan: 'trial',
      premiumExpiresAt: '2026-07-21T00:00:00.000Z',
    });
    mockRefreshUser.mockResolvedValue(undefined);
  });

  it('shows loading state while plans are fetching', () => {
    mockPlansQuery.isLoading = true;
    mockPlansQuery.data = undefined;

    const { UNSAFE_getByType } = renderWithProviders(<PremiumScreen />);
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders paywall plans and tracks paywall view', () => {
    const { getAllByText, getByText, getByTestId } = renderWithProviders(<PremiumScreen />);

    expect(getAllByText('Sopaan Pro').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Choose a plan')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('Yearly')).toBeTruthy();
    expect(getByTestId('premium-start-trial')).toBeTruthy();
    expect(getByTestId('premium-subscribe')).toBeTruthy();
    expect(mockTrackEvent).toHaveBeenCalledWith('paywall_view', { screen: 'Premium' });
  });

  it('shows congratulations dialog after starting a free trial', async () => {
    const { getByTestId, getByText } = renderWithProviders(<PremiumScreen />);

    fireEvent.press(getByTestId('premium-start-trial'));

    await waitFor(() => {
      expect(mockStartTrial).toHaveBeenCalled();
      expect(mockSetSessionUser).toHaveBeenCalled();
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(getByTestId('subscription-success-dialog')).toBeTruthy();
      expect(getByText('Welcome — 1 month free')).toBeTruthy();
      expect(getByTestId('subscription-success-primary')).toBeTruthy();
    });
  });

  it('renders active subscription state for premium users', () => {
    mockAuthUser.isPremium = true;

    const { getAllByText, getByText } = renderWithProviders(<PremiumScreen />);

    expect(getAllByText("You're on Sopaan Pro").length).toBeGreaterThanOrEqual(1);
    expect(getByText('31 Dec 2026')).toBeTruthy();
    expect(getByText('Manage subscription')).toBeTruthy();

    fireEvent.press(getByText('Manage subscription'));
    expect(mockNavigate).toHaveBeenCalledWith('ManageSubscription');
  });

  it('shows congratulations dialog with plan details after purchase', async () => {
    const { getByTestId, getByText } = renderWithProviders(<PremiumScreen />);

    fireEvent.press(getByTestId('premium-subscribe'));

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalled();
      expect(getByTestId('subscription-success-dialog')).toBeTruthy();
      expect(getByText('Welcome to Sopaan Pro')).toBeTruthy();
      expect(getByText('Explore Pro')).toBeTruthy();
      expect(getByText('14 Jul 2027')).toBeTruthy();
    });
  });

  it('shows Coming soon when payments are not configured', () => {
    mockPlansQuery.data = {
      ...MOCK_PREMIUM_PLANS,
      configured: false,
    };

    const { getByTestId, queryByTestId } = renderWithProviders(<PremiumScreen />);

    expect(getByTestId('premium-coming-soon')).toBeTruthy();
    expect(getByTestId('premium-subscribe-unavailable')).toBeTruthy();
    expect(queryByTestId('premium-subscribe')).toBeNull();
  });

  it('navigates to Practice when exploring after purchase', async () => {
    const { getByTestId } = renderWithProviders(<PremiumScreen />);

    fireEvent.press(getByTestId('premium-subscribe'));

    await waitFor(() => {
      expect(getByTestId('subscription-success-primary')).toBeTruthy();
    });

    fireEvent.press(getByTestId('subscription-success-primary'));
    expect(mockNavigate).toHaveBeenCalledWith('AppTabs', { screen: 'Home' });
  });
});

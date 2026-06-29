import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PremiumScreen } from '../app/PremiumScreen';
import { renderWithProviders } from '../../test/render';
import { MOCK_PREMIUM_PLANS } from '../../test/fixtures/stackScreens';

const mockNavigate = jest.fn();
const mockSetSessionUser = jest.fn();
const mockRefreshUser = jest.fn();
const mockTrackEvent = jest.fn();
const mockCheckout = jest.fn();
const mockStartTrial = jest.fn();

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
};

const mockAuthUser = {
  name: 'Arjun Patel',
  email: 'arjun@example.com',
  phone: '+919876543210',
  isPremium: false,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
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
    mockPlansQuery.isLoading = false;
    mockPlansQuery.data = MOCK_PREMIUM_PLANS;
    mockCheckout.mockResolvedValue({ user: { ...mockAuthUser, isPremium: true } });
    mockStartTrial.mockResolvedValue({ ...mockAuthUser, isPremium: true, premiumPlan: 'trial' });
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
    const { getByText, getByTestId } = renderWithProviders(<PremiumScreen />);

    expect(getByText('Sopaan Pro')).toBeTruthy();
    expect(getByText('Choose a plan')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('Yearly')).toBeTruthy();
    expect(getByTestId('premium-start-trial')).toBeTruthy();
    expect(getByTestId('premium-subscribe')).toBeTruthy();
    expect(mockTrackEvent).toHaveBeenCalledWith('paywall_view', { screen: 'Premium' });
  });

  it('starts a free trial from the paywall CTA', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = renderWithProviders(<PremiumScreen />);

    fireEvent.press(getByTestId('premium-start-trial'));

    await waitFor(() => {
      expect(mockStartTrial).toHaveBeenCalled();
      expect(mockSetSessionUser).toHaveBeenCalled();
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Trial started', expect.any(String));
    });

    alertSpy.mockRestore();
  });

  it('renders active subscription state for premium users', () => {
    mockAuthUser.isPremium = true;

    const { getByText } = renderWithProviders(<PremiumScreen />);

    expect(getByText("You're on Sopaan Pro")).toBeTruthy();
    expect(getByText('Manage subscription')).toBeTruthy();

    fireEvent.press(getByText('Manage subscription'));
    expect(mockNavigate).toHaveBeenCalledWith('ManageSubscription');
  });
});

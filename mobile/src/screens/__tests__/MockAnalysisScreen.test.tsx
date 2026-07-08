import { MockAnalysisScreen } from '../app/MockAnalysisScreen';
import { renderWithProviders } from '../../test/render';
import { createMockAttemptDetail } from '../../test/fixtures/stackScreens';

const mockUseAttempts = jest.fn();
const mockUseAttempt = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { attemptId: 'attempt-1' },
  }),
}));

jest.mock('../../hooks', () => ({
  useAttempts: (...args: unknown[]) => mockUseAttempts(...args),
  useAttempt: (...args: unknown[]) => mockUseAttempt(...args),
}));

describe('MockAnalysisScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAttempts.mockReturnValue({
      data: { items: [{ id: 'attempt-1' }] },
      isLoading: false,
    });
  });

  it('shows loading while attempt data is fetching', () => {
    mockUseAttempt.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { UNSAFE_getByType } = renderWithProviders(<MockAnalysisScreen />);
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('shows empty state when no attempt is available', () => {
    mockUseAttempt.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<MockAnalysisScreen />);

    expect(getByText('No mock attempt yet')).toBeTruthy();
    expect(getByText('Complete a mock test to see detailed analysis.')).toBeTruthy();
  });

  it('renders performance breakdown for a completed attempt', () => {
    mockUseAttempt.mockReturnValue({
      data: createMockAttemptDetail(),
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<MockAnalysisScreen />);

    expect(getByText('Daily GS Mock')).toBeTruthy();
    expect(getByText('#52')).toBeTruthy();
    expect(getByText('You vs topper vs average')).toBeTruthy();
    expect(getByText('Time per section')).toBeTruthy();
    expect(getByText(/Economy/)).toBeTruthy();
    expect(getByText(/You spent more time on polity/)).toBeTruthy();
    expect(getByText('Economy · Environment')).toBeTruthy();
  });
});

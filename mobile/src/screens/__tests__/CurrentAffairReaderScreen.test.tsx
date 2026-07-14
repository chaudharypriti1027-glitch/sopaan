import { fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { CurrentAffairReaderScreen } from '../app/CurrentAffairReaderScreen';
import { renderWithProviders } from '../../test/render';
import { createMockCurrentAffair } from '../../test/fixtures/stackScreens';

const mockRefetch = jest.fn();
const mockAiRefetch = jest.fn();
const mockUseCurrentAffair = jest.fn();
const mockUseCurrentAffairAiSummary = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { affairId: 'ca-1' },
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('../../navigation/askAiNavigation', () => ({
  navigateToAskAI: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  useCurrentAffair: (...args: unknown[]) => mockUseCurrentAffair(...args),
  useCurrentAffairAiSummary: (...args: unknown[]) => mockUseCurrentAffairAiSummary(...args),
  useNetworkStatus: () => ({ isOffline: false }),
}));

describe('CurrentAffairReaderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
    mockAiRefetch.mockResolvedValue(undefined);
    mockUseCurrentAffair.mockReturnValue({
      data: createMockCurrentAffair(),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: mockRefetch,
    });
    mockUseCurrentAffairAiSummary.mockReturnValue({
      data: {
        affairId: 'ca-1',
        title: 'RBI keeps repo rate unchanged',
        summary: 'AI recap: RBI held the repo rate at 6.5% amid inflation concerns.',
        shortAnswer: 'Repo rate unchanged at 6.5%.',
        examTip: 'Link RBI policy and inflation when revising.',
        keyPoints: ['Repo rate steady', 'Inflation watch continues'],
        category: 'Economy',
        source: 'cached',
        generatedAt: '2026-06-20T10:00:00.000Z',
      },
      isLoading: false,
      isError: false,
      refetch: mockAiRefetch,
    });
  });

  it('shows loading copy while the article is fetching', () => {
    mockUseCurrentAffair.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<CurrentAffairReaderScreen />);

    expect(getByTestId('query-state-skeleton')).toBeTruthy();
  });

  it('shows error state and retries fetch', async () => {
    mockUseCurrentAffair.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: mockRefetch,
    });

    const { getByText, getByTestId } = renderWithProviders(<CurrentAffairReaderScreen />);

    expect(getByText('Could not load content')).toBeTruthy();
    fireEvent.press(getByTestId('button-retry'));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('renders article content, AI summary, and opens the source link', () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const { getByText, getByTestId } = renderWithProviders(<CurrentAffairReaderScreen />);

    expect(getByText('RBI keeps repo rate unchanged')).toBeTruthy();
    expect(getByTestId('ca-ai-summary-card')).toBeTruthy();
    expect(getByText(/AI recap: RBI held the repo rate/)).toBeTruthy();
    expect(getByText(/Reserve Bank of India/)).toBeTruthy();
    expect(getByText(/Source: PIB/)).toBeTruthy();

    fireEvent.press(getByText('Read on source site'));
    expect(openUrl).toHaveBeenCalledWith('https://example.com/rbi-rate');

    openUrl.mockRestore();
  });
});

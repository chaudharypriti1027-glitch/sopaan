import { fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { CurrentAffairReaderScreen } from '../app/CurrentAffairReaderScreen';
import { renderWithProviders } from '../../test/render';
import { createMockCurrentAffair } from '../../test/fixtures/stackScreens';

const mockRefetch = jest.fn();
const mockUseCurrentAffair = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { affairId: 'ca-1' },
  }),
}));

jest.mock('../../hooks', () => ({
  useCurrentAffair: (...args: unknown[]) => mockUseCurrentAffair(...args),
  useNetworkStatus: () => ({ isOffline: false }),
}));

describe('CurrentAffairReaderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
    mockUseCurrentAffair.mockReturnValue({
      data: createMockCurrentAffair(),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: mockRefetch,
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

    const { UNSAFE_getByType } = renderWithProviders(<CurrentAffairReaderScreen />);
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
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

  it('renders article content and opens the source link', () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const { getByText } = renderWithProviders(<CurrentAffairReaderScreen />);

    expect(getByText('RBI keeps repo rate unchanged')).toBeTruthy();
    expect(getByText(/Reserve Bank of India/)).toBeTruthy();
    expect(getByText(/Source: PIB/)).toBeTruthy();

    fireEvent.press(getByText('Read on source site'));
    expect(openUrl).toHaveBeenCalledWith('https://example.com/rbi-rate');

    openUrl.mockRestore();
  });
});

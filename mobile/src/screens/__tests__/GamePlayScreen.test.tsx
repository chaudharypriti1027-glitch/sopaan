import { fireEvent, waitFor } from '@testing-library/react-native';
import { GamePlayScreen } from '../app/GamePlayScreen';
import { renderWithProviders } from '../../test/render';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockMutate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({
    params: { gameId: 'word-scramble', sessionId: 1 },
  }),
}));

jest.mock('../../hooks', () => ({
  useCompleteGame: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useGameProgress: () => ({
    recordComplete: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('../../games/WordScrambleGame', () => {
  const { Pressable, Text } = require('react-native');
  return {
    WordScrambleGame: ({ onComplete }: { onComplete: (score: number) => void }) => (
      <Pressable accessibilityRole="button" testID="mock-finish-game" onPress={() => onComplete(80)}>
        <Text>Mock game</Text>
      </Pressable>
    ),
  };
});

describe('GamePlayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls completeGame when a game finishes', async () => {
    const { getByTestId } = renderWithProviders(<GamePlayScreen />);

    fireEvent.press(getByTestId('mock-finish-game'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { gameId: 'word-scramble', score: 80 },
        expect.any(Object),
      );
    });
  });
});

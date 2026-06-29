import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QuizScreen } from '../app/QuizScreen';
import { renderWithProviders } from '../../test/render';
import { createMockSubmitResult, createMockTest, MOCK_TEST_ID } from '../../test/fixtures/stackScreens';

const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockMutateAsync = jest.fn();
const mockHandleProError = jest.fn(() => false);

const mockUseTest = jest.fn();
const mockListAttempts = jest.fn(async (_params?: unknown) => ({ items: [] }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    replace: mockReplace,
  }),
  useRoute: () => ({
    params: { testId: MOCK_TEST_ID },
  }),
}));

jest.mock('../../hooks', () => ({
  useTest: (...args: unknown[]) => mockUseTest(...args),
  useSubmitTest: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useProGate: () => ({
    handleProError: mockHandleProError,
  }),
}));

jest.mock('../../api', () => ({
  attemptsApi: {
    listAttempts: (params?: unknown) => mockListAttempts(params),
  },
}));

jest.mock('../../perf', () => ({
  useScreenPerf: jest.fn(),
}));

describe('QuizScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTest.mockReturnValue({
      data: createMockTest(),
      isLoading: false,
      isError: false,
    });
    mockMutateAsync.mockResolvedValue(createMockSubmitResult());
  });

  it('shows loading state while the test is fetching', () => {
    mockUseTest.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { queryByText, UNSAFE_getByType } = renderWithProviders(<QuizScreen />);
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('What is the capital of India?')).toBeNull();
  });

  it('shows error state with go back when the test fails to load', () => {
    mockUseTest.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const { getByText } = renderWithProviders(<QuizScreen />);

    expect(getByText('Could not load this test.')).toBeTruthy();
    fireEvent.press(getByText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders the first question and advances after selecting an answer', async () => {
    const { getByText, getByTestId } = renderWithProviders(<QuizScreen />);

    expect(getByText('What is the capital of India?')).toBeTruthy();
    expect(getByText('Question 1 of 2')).toBeTruthy();

    fireEvent.press(getByTestId('quiz-option-b'));
    fireEvent.press(getByTestId('quiz-next'));

    await waitFor(() => {
      expect(getByText('Who wrote the Indian Constitution?')).toBeTruthy();
    });
  });

  it('submits answers and navigates to the result screen', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByTestId } = renderWithProviders(<QuizScreen />);

    fireEvent.press(getByTestId('quiz-option-b'));
    fireEvent.press(getByTestId('quiz-next'));

    await waitFor(() => {
      expect(getByText('Who wrote the Indian Constitution?')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quiz-option-a'));

    await act(async () => {
      fireEvent.press(getByTestId('quiz-submit'));
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        answers: [
          { questionId: 'q1', selectedKey: 'B', timeSec: expect.any(Number) },
          { questionId: 'q2', selectedKey: 'A', timeSec: expect.any(Number) },
        ],
      });
      expect(mockReplace).toHaveBeenCalledWith(
        'Result',
        expect.objectContaining({
          attemptId: 'attempt-1',
          testId: MOCK_TEST_ID,
        }),
      );
    });

    alertSpy.mockRestore();
  });

  it('prompts before submitting with unanswered questions', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = renderWithProviders(<QuizScreen />);

    fireEvent.press(getByTestId('quiz-option-b'));
    fireEvent.press(getByTestId('quiz-next'));

    await waitFor(() => {
      expect(getByTestId('quiz-submit')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quiz-submit'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Submit test?',
      expect.stringContaining('unanswered'),
      expect.any(Array),
    );

    alertSpy.mockRestore();
  });
});

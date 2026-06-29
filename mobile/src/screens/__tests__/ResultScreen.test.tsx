import { fireEvent } from '@testing-library/react-native';
import { ResultScreen } from '../app/ResultScreen';
import { renderWithProviders } from '../../test/render';
import { createMockSubmitResult } from '../../test/fixtures/stackScreens';

const mockNavigate = jest.fn();
const mockResult = createMockSubmitResult();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      attemptId: 'attempt-1',
      testId: 'test-mock-1',
      previousRank: 60,
      result: mockResult,
    },
  }),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({
    user: { name: 'Arjun Patel' },
  }),
}));

jest.mock('../../components/RelatedQuestions', () => ({
  RelatedQuestions: () => null,
}));

describe('ResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders score, AI coach feedback, and topic breakdown', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    expect(getByText('Test result')).toBeTruthy();
    expect(getByText('Score 2/2')).toBeTruthy();
    expect(getByText('Strong accuracy — keep revising polity edge cases.')).toBeTruthy();
    expect(getByText('Indian Polity')).toBeTruthy();
    expect(getByText('Review answers')).toBeTruthy();
    expect(getByText('Q1. What is the capital of India?')).toBeTruthy();
  });

  it('navigates to practice from AI coach CTA', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    fireEvent.press(getByText('Practice weak topics'));

    expect(mockNavigate).toHaveBeenCalledWith('AppTabs', { screen: 'Practice' });
  });

  it('navigates to mock analysis and back to practice', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    fireEvent.press(getByText('View mock analysis'));
    expect(mockNavigate).toHaveBeenCalledWith('MockAnalysis', { attemptId: 'attempt-1' });

    fireEvent.press(getByText('Back to Practice'));
    expect(mockNavigate).toHaveBeenCalledWith('AppTabs', { screen: 'Practice' });
  });
});

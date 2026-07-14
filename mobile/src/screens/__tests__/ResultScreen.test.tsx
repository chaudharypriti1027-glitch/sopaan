import { fireEvent } from '@testing-library/react-native';
import { ResultScreen } from '../app/ResultScreen';
import { renderWithProviders } from '../../test/render';
import { createMockSubmitResult } from '../../test/fixtures/stackScreens';
import { useAuthStore } from '../../store/auth';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockResult = createMockSubmitResult();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    goBack: jest.fn(),
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

jest.mock('../../components/RelatedQuestions', () => ({
  RelatedQuestions: () => null,
}));

describe('ResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      profile: {
        id: 'user_1',
        name: 'Arjun Patel',
        phone: '+919876543210',
        state: 'Gujarat',
        targetExam: 'SSC CGL',
        language: 'en',
        createdAt: '2026-01-01T00:00:00.000Z',
        rank: null,
        level: 1,
        coins: 0,
        onboardingComplete: true,
      },
      status: 'authed',
    });
  });

  it('renders premium result hero, coach feedback, and topic breakdown', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    expect(getByText('Result')).toBeTruthy();
    expect(getByText('2 of 2 correct · 2:00 taken')).toBeTruthy();
    expect(getByText('Strong accuracy — keep revising polity edge cases.')).toBeTruthy();
    expect(getByText('GK')).toBeTruthy();
    expect(getByText('Review solutions')).toBeTruthy();
    expect(getByText('Q1. What is the capital of India?')).toBeTruthy();
  });

  it('navigates to practice from AI coach CTA', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    fireEvent.press(getByText('Practice weak topics'));

    expect(mockNavigate).toHaveBeenCalledWith('AppTabs', {
      screen: 'Practice',
      params: {
        weakTopics: ['Indian Polity'],
        openForm: true,
      },
    });
  });

  it('navigates to mock analysis, retake, and more tests', () => {
    const { getByText } = renderWithProviders(<ResultScreen />);

    fireEvent.press(getByText('View mock analysis'));
    expect(mockNavigate).toHaveBeenCalledWith('MockAnalysis', { attemptId: 'attempt-1' });

    fireEvent.press(getByText('Retake'));
    expect(mockReplace).toHaveBeenCalledWith('Quiz', { testId: 'test-mock-1' });

    fireEvent.press(getByText('More tests'));
    expect(mockNavigate).toHaveBeenCalledWith('AppTabs', { screen: 'Practice' });
  });
});

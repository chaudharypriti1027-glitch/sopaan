import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { OtpScreen } from '../OtpScreen';
import { renderWithProviders } from '../../test/render';

const mockGoBack = jest.fn();
const mockVerifyOtp = jest.fn();
const mockRequestOtp = jest.fn();
const mockCompleteStudentLogin = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: { phone: '+919876543210' },
  }),
}));

jest.mock('../../api', () => ({
  authApi: {
    verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
  },
  parseApiError: (err: unknown) =>
    err instanceof Error
      ? { message: err.message, code: 'INVALID_OTP', status: 400, details: { attemptsRemaining: 2 } }
      : { message: 'Error', code: 'UNKNOWN', status: 0 },
}));

jest.mock('../../auth/studentSession', () => ({
  completeStudentLogin: (...args: unknown[]) => mockCompleteStudentLogin(...args),
}));

jest.mock('../../hooks/useResendCountdown', () => ({
  useResendCountdown: () => ({
    remaining: 0,
    canResend: true,
    reset: jest.fn(),
  }),
}));

describe('OtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockVerifyOtp.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      isNewUser: true,
      profile: {
        id: '1',
        name: 'Student',
        phone: '+919876543210',
        state: '',
        targetExam: '',
        language: 'en',
        createdAt: '',
      },
    });
    mockCompleteStudentLogin.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows masked phone in subtitle', () => {
    const { getByText } = renderWithProviders(<OtpScreen />);
    expect(getByText('Code sent to +91 •••• ••10')).toBeTruthy();
  });

  it('auto-submits when 6 digits entered', async () => {
    const { getAllByDisplayValue } = renderWithProviders(<OtpScreen />);
    const first = getAllByDisplayValue('')[0];

    await act(async () => {
      fireEvent.changeText(first, '123456');
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        phone: '+919876543210',
        code: '123456',
      });
      expect(mockCompleteStudentLogin).toHaveBeenCalled();
    });
  });
});

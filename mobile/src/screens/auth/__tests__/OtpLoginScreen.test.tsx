import { fireEvent, waitFor } from '@testing-library/react-native';
import { OtpLoginScreen } from '../OtpLoginScreen';
import { renderWithProviders } from '../../../test/render';

const mockNavigate = jest.fn();
const mockRequestOtp = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
  }),
}));

jest.mock('../../../api', () => ({
  authApi: {
    requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
  },
  privacyApi: {
    getPolicy: jest.fn().mockResolvedValue({ version: '2025-06-01' }),
  },
  parseApiError: (err: unknown) => ({
    message: err instanceof Error ? err.message : 'Something went wrong',
    code: 'UNKNOWN',
    status: 0,
  }),
}));

describe('OtpLoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestOtp.mockResolvedValue({ sent: true });
  });

  it('keeps Send OTP disabled until phone is valid and consent is checked', () => {
    const { getByTestId, getByRole } = renderWithProviders(<OtpLoginScreen />);

    fireEvent.changeText(getByTestId('otp-login-phone'), '98765');
    expect(getByRole('button', { name: 'Send OTP' })).toBeDisabled();
  });

  it('requests an OTP and navigates to the verify screen with consent attached', async () => {
    const { getByTestId, getByRole } = renderWithProviders(<OtpLoginScreen />);

    fireEvent.changeText(getByTestId('otp-login-phone'), '9876543210');
    fireEvent.press(getByTestId('otp-login-consent'));
    fireEvent.press(getByRole('button', { name: 'Send OTP' }));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith({ phone: '+919876543210' });
      expect(mockNavigate).toHaveBeenCalledWith('Otp', {
        phone: '+919876543210',
        privacyConsent: {
          policyVersion: '2025-06-01',
          aiProcessing: true,
          marketing: false,
        },
      });
    });
  });

  it('navigates back to email login', () => {
    const { getByRole } = renderWithProviders(<OtpLoginScreen />);

    fireEvent.press(getByRole('button', { name: 'Back to email login' }));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});

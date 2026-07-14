import { fireEvent, waitFor } from '@testing-library/react-native';
import { OtpLoginScreen } from '../OtpLoginScreen';
import { renderWithProviders } from '../../../test/render';

const mockNavigate = jest.fn();
const mockRequestOtp = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockNavigate,
    dispatch: jest.fn(),
  }),
  useRoute: () => ({ params: undefined }),
}));

jest.mock('../../../auth/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({
    signInWithGoogle: jest.fn(),
    loading: false,
    isConfigured: true,
  }),
}));

jest.mock('../../../auth/completeGoogleLogin', () => ({
  completeGoogleLogin: jest.fn(),
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

async function renderOtpLogin() {
  const result = renderWithProviders(<OtpLoginScreen />);
  await waitFor(() => {
    expect(jest.requireMock('../../../api').privacyApi.getPolicy).toHaveBeenCalled();
  });
  return result;
}

describe('OtpLoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestOtp.mockResolvedValue({ sent: true });
  });

  it('keeps Send OTP disabled until phone is valid and consent is checked', async () => {
    const { getByTestId, getByRole } = await renderOtpLogin();

    fireEvent.changeText(getByTestId('otp-login-phone'), '98765');
    expect(getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('requests an OTP and navigates to the verify screen with consent attached', async () => {
    const { getByTestId, getByRole } = await renderOtpLogin();

    fireEvent.changeText(getByTestId('otp-login-phone'), '9876543210');
    fireEvent.press(getByTestId('otp-login-consent'));
    fireEvent.press(getByRole('button', { name: 'Continue' }));

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

  it('navigates to email login from the secondary link', async () => {
    const { getByTestId } = await renderOtpLogin();

    fireEvent.press(getByTestId('otp-login-email-link'));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('starts Google sign-in after consent is accepted', async () => {
    const { completeGoogleLogin } = jest.requireMock('../../../auth/completeGoogleLogin');
    const { getByTestId } = await renderOtpLogin();

    fireEvent.press(getByTestId('otp-login-consent'));
    fireEvent.press(getByTestId('otp-login-google'));

    await waitFor(() => {
      expect(completeGoogleLogin).toHaveBeenCalled();
    });
  });
});

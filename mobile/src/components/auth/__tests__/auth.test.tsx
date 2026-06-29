import { fireEvent } from '@testing-library/react-native';
import { BrandHeader, Field, GhostButton, OtpInput, PrimaryButton } from '..';
import { renderWithProviders } from '../../../test/render';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('auth primitives', () => {
  it('renders BrandHeader title and subtitle', () => {
    const { getByText } = renderWithProviders(
      <BrandHeader title="Welcome back" subtitle="Sign in to continue" />,
    );

    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
  });

  it('PrimaryButton handles press', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProviders(
      <PrimaryButton label="Continue" onPress={onPress} />,
    );

    fireEvent.press(getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('GhostButton renders label', () => {
    const { getByText } = renderWithProviders(<GhostButton label="Use OTP instead" />);
    expect(getByText('Use OTP instead')).toBeTruthy();
  });

  it('Field normalizes phone digits', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Field variant="phone" label="Phone" value="" onChangeText={onChangeText} testID="phone-field" />,
    );

    fireEvent.changeText(getByTestId('phone-field'), '98abc76543210');
    expect(onChangeText).toHaveBeenCalledWith('9876543210');
  });

  it('OtpInput accepts pasted code', () => {
    const onChange = jest.fn();
    const { getAllByDisplayValue } = renderWithProviders(
      <OtpInput value="" onChange={onChange} />,
    );

    const first = getAllByDisplayValue('')[0];
    fireEvent.changeText(first, '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
  });
});

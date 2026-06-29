import { fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { renderWithProviders } from '../../test/render';

describe('Button', () => {
  it('renders the label and handles press', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProviders(
      <Button label="Continue" onPress={onPress} />,
    );

    fireEvent.press(getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProviders(
      <Button label="Disabled" onPress={onPress} disabled />,
    );

    fireEvent.press(getByRole('button', { name: 'Disabled' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label', () => {
    const { queryByText, UNSAFE_getByType } = renderWithProviders(
      <Button label="Saving" loading />,
    );

    expect(queryByText('Saving')).toBeNull();
    expect(UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('renders ghost variant label', () => {
    const { getByText } = renderWithProviders(
      <Button label="Ghost action" variant="ghost" />,
    );

    expect(getByText('Ghost action')).toBeTruthy();
  });
});

import { fireEvent } from '@testing-library/react-native';
import { QuizOption } from '../QuizOption';
import { renderWithProviders } from '../../test/render';

describe('QuizOption', () => {
  it('renders default state and handles selection', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <QuizOption label="Delhi" indexLabel="A" onPress={onPress} />,
    );

    expect(getByText('Delhi')).toBeTruthy();
    fireEvent.press(getByText('Delhi'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders selected state', () => {
    const { getByText } = renderWithProviders(
      <QuizOption label="Mumbai" indexLabel="B" state="selected" />,
    );

    expect(getByText('Mumbai')).toBeTruthy();
  });

  it('renders correct state and blocks presses', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <QuizOption label="Kolkata" indexLabel="C" state="correct" onPress={onPress} />,
    );

    fireEvent.press(getByText('Kolkata'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders wrong state and blocks presses', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <QuizOption label="Chennai" indexLabel="D" state="wrong" onPress={onPress} />,
    );

    fireEvent.press(getByText('Chennai'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

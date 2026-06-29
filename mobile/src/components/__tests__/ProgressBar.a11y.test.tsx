import { renderWithProviders } from '../../test/render';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar accessibility', () => {
  it('exposes progressbar role with label', () => {
    const { getByRole } = renderWithProviders(
      <ProgressBar value={72} max={100} label="Readiness" />,
    );

    expect(getByRole('progressbar', { name: 'Readiness, 72 percent' })).toBeTruthy();
  });
});

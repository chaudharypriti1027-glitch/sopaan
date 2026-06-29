import { RankRing } from '../RankRing';
import { renderWithProviders } from '../../test/render';

describe('RankRing', () => {
  it('exposes progressbar semantics with label', () => {
    const { getByRole } = renderWithProviders(
      <RankRing value={72} label="Readiness" />,
    );

    expect(getByRole('progressbar', { name: 'Readiness, 72 of 100' })).toBeTruthy();
  });

  it('rounds the spoken value', () => {
    const { getByRole } = renderWithProviders(<RankRing value={72.6} max={100} />);
    expect(getByRole('progressbar', { name: '73 of 100' })).toBeTruthy();
  });
});

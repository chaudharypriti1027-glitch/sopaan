import { pickMotivationIndex, pickTipIndices } from '../testReadyContent';

describe('testReadyContent', () => {
  it('picks stable motivation index for same seed', () => {
    expect(pickMotivationIndex('polity-ssc')).toBe(pickMotivationIndex('polity-ssc'));
  });

  it('returns unique tip indices', () => {
    const tips = pickTipIndices('history-banking', 4);
    expect(tips).toHaveLength(4);
    expect(new Set(tips).size).toBe(4);
  });
});

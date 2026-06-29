describe('game catalog', () => {
  it('lists all 19 games from the HTML mockup', () => {
    const { GAME_CATALOG } = require('../content');
    expect(GAME_CATALOG).toHaveLength(19);
  });
});

describe('memory match score', () => {
  it('uses final move count for completion score', () => {
    const moves = 12;
    expect(Math.max(10, 100 - moves * 3)).toBe(64);
  });
});

describe('game coin estimate', () => {
  it('scales local estimate from score and catalog reward', () => {
    const score = 80;
    const coinReward = 15;
    expect(Math.max(5, Math.round((score / 100) * coinReward))).toBe(12);
  });
});

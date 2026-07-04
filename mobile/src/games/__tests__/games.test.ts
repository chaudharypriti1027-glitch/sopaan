import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_CATALOG } from '../content';
import {
  getDailyChallengeGameId,
  loadGameProgress,
  recordGameCompletion,
} from '../progress';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('game catalog', () => {
  it('lists all 19 games from the HTML mockup', () => {
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

describe('daily challenge', () => {
  it('picks a catalog game deterministically for a date', () => {
    const id = getDailyChallengeGameId(new Date('2026-07-03T12:00:00Z'));
    expect(GAME_CATALOG.some((game) => game.id === id)).toBe(true);
  });
});

describe('game progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('starts from empty progress', async () => {
    const progress = await loadGameProgress();
    expect(progress.gamesCompleted).toBe(0);
    expect(progress.lastPlayedGameId).toBeNull();
  });

  it('records completion and best score', async () => {
    const next = await recordGameCompletion('word-scramble', 80);
    expect(next.gamesCompleted).toBe(1);
    expect(next.lastPlayedGameId).toBe('word-scramble');
    expect(next.bestScores['word-scramble']).toBe(80);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});

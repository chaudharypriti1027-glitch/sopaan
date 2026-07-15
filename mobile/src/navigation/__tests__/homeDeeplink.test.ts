import { HOME_QUICK_ACTIONS } from '../../../../shared/homeFeed.constants.js';
import { navigateHomeDeeplink } from '../homeDeeplink';

const mockNavigate = jest.fn();
const mockStackNavigate = jest.fn();

function createNavigation() {
  const stackNav = {
    navigate: mockStackNavigate,
    getState: () => ({
      routeNames: ['AppTabs', 'AskAI', 'TestReady', 'Quiz', 'Games', 'GamePlay'],
      routes: [{ name: 'AppTabs' }],
      index: 0,
    }),
    getParent: () => undefined,
  };

  return {
    navigate: mockNavigate,
    dispatch: jest.fn(),
    getState: () => ({ routeNames: ['Home'], routes: [{ name: 'Home' }], index: 0 }),
    getParent: () => stackNav,
  } as never;
}

const QUICK_ACTION_SCREEN_TARGETS = {
  test: { type: 'tab' as const, screen: 'Practice' },
  ai: { type: 'stack' as const, screen: 'AskAI' },
  ca: { type: 'tab' as const, screen: 'CurrentAffairs' },
  games: { type: 'stack' as const, screen: 'Games' },
};

describe('HOME_QUICK_ACTIONS deeplinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defines the expected deeplink path for each quick action', () => {
    expect(Object.fromEntries(HOME_QUICK_ACTIONS.map((action) => [action.key, action.deeplink]))).toEqual({
      test: '/tabs/Practice',
      ai: '/stack/AskAI',
      ca: '/tabs/CurrentAffairs',
      games: '/stack/Games',
    });
  });

  it.each(HOME_QUICK_ACTIONS)('$label ($key) navigates to the intended screen', (action) => {
    const navigation = createNavigation();
    const target = QUICK_ACTION_SCREEN_TARGETS[action.key as keyof typeof QUICK_ACTION_SCREEN_TARGETS];

    navigateHomeDeeplink(navigation, action.deeplink);

    if (target.type === 'tab') {
      expect(mockNavigate).toHaveBeenCalledWith(target.screen);
      expect(mockStackNavigate).not.toHaveBeenCalled();
      return;
    }

    expect(mockStackNavigate).toHaveBeenCalledWith(target.screen);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('navigateHomeDeeplink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to Games stack screen', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/stack/Games');
    expect(mockStackNavigate).toHaveBeenCalledWith('Games');
  });

  it('navigates to GamePlay with gameId param', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/stack/GamePlay/rapid-fire');
    expect(mockStackNavigate).toHaveBeenCalledWith('GamePlay', { gameId: 'rapid-fire' });
  });

  it('navigates to GamePlay with affair quiz params', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/stack/GamePlay/rapid-fire?affairId=ca-42');
    expect(mockStackNavigate).toHaveBeenCalledWith('GamePlay', {
      gameId: 'rapid-fire',
      affairId: 'ca-42',
    });
  });

  it('opens Ask AI on the main stack', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/stack/AskAI');
    expect(mockStackNavigate).toHaveBeenCalledWith('AskAI');
  });

  it('opens recommended tests on the readiness screen', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/stack/TestReady/test-42');
    expect(mockStackNavigate).toHaveBeenCalledWith('TestReady', { testId: 'test-42' });
  });

  it('routes drill deeplinks to Practice with topic', () => {
    const navigation = createNavigation();
    navigateHomeDeeplink(navigation, '/drill/modern-history');
    expect(mockNavigate).toHaveBeenCalledWith('Practice', { topic: 'modern history' });
  });
});

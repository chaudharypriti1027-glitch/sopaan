import { CommonActions } from '@react-navigation/native';
import { isAskAiScreenOpen, navigateToAskAI } from '../askAiNavigation';

function createTabNavigation(routeNames: string[]) {
  const navigate = jest.fn();
  const dispatch = jest.fn();
  const getState = jest.fn(() => ({
    routeNames,
    routes: [{ name: 'AppTabs' }],
    index: 0,
  }));

  return {
    navigate,
    dispatch,
    getState,
    getParent: jest.fn(),
  };
}

function createMainStackNavigation(activeRoute = 'AppTabs') {
  const routes =
    activeRoute === 'AskAI'
      ? [{ name: 'AppTabs' }, { name: 'AskAI' }]
      : [{ name: 'AppTabs' }];
  const index = activeRoute === 'AskAI' ? 1 : 0;

  const mainStack = {
    navigate: jest.fn(),
    dispatch: jest.fn(),
    getState: jest.fn(() => ({
      routeNames: ['AppTabs', 'AskAI', 'Quiz'],
      routes,
      index,
    })),
    getParent: jest.fn(),
  };

  return mainStack;
}

describe('navigateToAskAI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates on the main stack from a tab navigator', () => {
    const mainStack = createMainStackNavigation();
    const tabNav = createTabNavigation(['Home', 'Practice', 'CurrentAffairs', 'Profile']);
    tabNav.getParent.mockReturnValue(mainStack);

    navigateToAskAI(tabNav as never);

    expect(mainStack.navigate).toHaveBeenCalledWith('AskAI');
  });

  it('navigates directly when already on the main stack', () => {
    const mainStack = createMainStackNavigation('Forum' as never);
    mainStack.getState.mockReturnValue({
      routeNames: ['AppTabs', 'AskAI', 'Forum'],
      routes: [{ name: 'AppTabs' }, { name: 'Forum' }],
      index: 1,
    });

    navigateToAskAI(mainStack as never);

    expect(mainStack.navigate).toHaveBeenCalledWith('AskAI');
    expect(mainStack.getParent).not.toHaveBeenCalled();
  });

  it('falls back to root nested navigation when no parent owns AskAI', () => {
    const tabNav = createTabNavigation(['Home']);
    tabNav.getParent.mockReturnValue(undefined);

    navigateToAskAI(tabNav as never);

    expect(tabNav.dispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'AskAI' },
      }),
    );
  });
});

describe('isAskAiScreenOpen', () => {
  it('returns true when Ask AI is the active main-stack route', () => {
    const mainStack = createMainStackNavigation('AskAI');
    const tabNav = createTabNavigation(['Home']);
    tabNav.getParent.mockReturnValue(mainStack);

    expect(isAskAiScreenOpen(tabNav as never)).toBe(true);
  });

  it('returns false when tabs are showing', () => {
    const mainStack = createMainStackNavigation('AppTabs');
    const tabNav = createTabNavigation(['Home']);
    tabNav.getParent.mockReturnValue(mainStack);

    expect(isAskAiScreenOpen(tabNav as never)).toBe(false);
  });
});

import { CommonActions, type NavigationProp, type ParamListBase } from '@react-navigation/native';

type AnyNavigation = Pick<NavigationProp<ParamListBase>, 'navigate' | 'dispatch' | 'getState' | 'getParent'>;

export type AskAiNavParams = {
  initialPrompt?: string;
};

function navigatorHasAskAI(nav: AnyNavigation): boolean {
  const routeNames = nav.getState?.()?.routeNames;
  return Array.isArray(routeNames) && routeNames.includes('AskAI');
}

/** True when Ask AI is the active screen on the main stack. */
export function isAskAiScreenOpen(navigation: AnyNavigation): boolean {
  let current: AnyNavigation | undefined = navigation;

  while (current) {
    if (navigatorHasAskAI(current)) {
      const state = current.getState();
      const route = state.routes[state.index ?? 0];
      return route?.name === 'AskAI';
    }
    current = current.getParent() ?? undefined;
  }

  return false;
}

/** Open Ask AI on the main stack (works from tabs, stack screens, and nested navigators). */
export function navigateToAskAI(navigation: AnyNavigation, params?: AskAiNavParams) {
  let current: AnyNavigation | undefined = navigation;

  while (current) {
    if (navigatorHasAskAI(current)) {
      if (params?.initialPrompt) {
        (current.navigate as (name: string, p?: AskAiNavParams) => void)('AskAI', params);
      } else {
        (current.navigate as (name: string) => void)('AskAI');
      }
      return;
    }
    current = current.getParent() ?? undefined;
  }

  navigation.dispatch(
    CommonActions.navigate('Main', {
      screen: 'AskAI',
      params: params ?? undefined,
    }),
  );
}

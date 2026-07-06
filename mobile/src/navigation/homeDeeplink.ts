import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GameId } from '../games/types';
import { navigateToAskAI } from './askAiNavigation';
import type { AppTabParamList, MainStackParamList } from './types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

/** Navigate from server-driven home feed deeplinks. */
export function navigateHomeDeeplink(navigation: HomeNav, deeplink: string) {
  const path = deeplink.replace(/^\//, '');
  const [area, screen, param] = path.split('/');

  if (area === 'tabs') {
    if (screen === 'AskAI') {
      navigateToAskAI(navigation);
      return;
    }
    if (screen === 'Practice' || screen === 'CurrentAffairs' || screen === 'Home' || screen === 'Profile') {
      navigation.navigate(screen as keyof AppTabParamList);
    }
    return;
  }

  if (area === 'drill') {
    navigation.navigate('Practice');
    return;
  }

  if (area === 'stack' && screen) {
    if (screen === 'AskAI') {
      navigateToAskAI(navigation);
      return;
    }

    const stackNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
    if (!stackNav) {
      if (screen === 'Quiz' && param) {
        navigateToAskAI(navigation);
      }
      return;
    }

    switch (screen) {
      case 'Quiz':
        if (param) stackNav.navigate('Quiz', { testId: param });
        break;
      case 'CourseDetail':
        if (param) stackNav.navigate('CourseDetail', { courseId: param });
        break;
      case 'TestSeries':
        stackNav.navigate('TestSeries');
        break;
      case 'Flashcards':
        stackNav.navigate('Flashcards');
        break;
      case 'ExamCalendar':
        stackNav.navigate('ExamCalendar');
        break;
      case 'Readiness':
        stackNav.navigate('Readiness');
        break;
      case 'Notifications':
        stackNav.navigate('Notifications');
        break;
      case 'Search':
        stackNav.navigate('Search');
        break;
      case 'Leaderboard':
        stackNav.navigate('Leaderboard');
        break;
      case 'Premium':
        stackNav.navigate('Premium');
        break;
      case 'LiveClasses':
        stackNav.navigate('LiveClasses');
        break;
      case 'Games':
        stackNav.navigate('Games');
        break;
      case 'GamePlay':
        if (param) {
          stackNav.navigate('GamePlay', { gameId: param as GameId });
        }
        break;
      default:
        break;
    }
  }
}

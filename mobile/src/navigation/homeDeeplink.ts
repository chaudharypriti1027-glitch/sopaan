import { CommonActions } from '@react-navigation/native';
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

/** Stack routes that accept a single string id from `/stack/Screen/id`. */
const STACK_ID_PARAMS: Partial<Record<keyof MainStackParamList, string>> = {
  Quiz: 'testId',
  CourseDetail: 'courseId',
  BookReader: 'bookId',
  GamePlay: 'gameId',
  CurrentAffairReader: 'affairId',
  ExamDetail: 'examId',
  LiveClassViewer: 'liveClassId',
  MockAnalysis: 'attemptId',
  GroupChat: 'groupId',
  TestSeries: 'seriesId',
  StudyPlanner: 'date',
  ProgressAnalytics: 'weekKey',
  Leaderboard: 'testId',
};

const STACK_NO_PARAM: (keyof MainStackParamList)[] = [
  'Flashcards',
  'ExamCalendar',
  'Readiness',
  'Notifications',
  'Search',
  'Premium',
  'LiveClasses',
  'Games',
  'Books',
  'Courses',
  'Forum',
  'CutoffsForms',
  'FocusTimer',
  'Wellness',
  'Rewards',
  'ReferEarn',
  'Mentors',
  'Roadmap',
  'AnswerEvaluation',
  'PhysicalTest',
  'RevisionCapsules',
  'Vocabulary',
  'Notes',
  'Settings',
  'CommunityTests',
  'CreateTest',
  'SuccessStories',
  'ManageSubscription',
];

function navigateMainStack(
  navigation: HomeNav,
  screen: keyof MainStackParamList,
  params?: MainStackParamList[keyof MainStackParamList],
) {
  const stackNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  if (stackNav) {
    if (params !== undefined) {
      (stackNav.navigate as (name: string, p?: object) => void)(screen, params);
    } else {
      (stackNav.navigate as (name: string) => void)(screen);
    }
    return;
  }

  navigation.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: { screen, params },
    }),
  );
}

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
    const topicSlug = screen?.replace(/-/g, ' ');
    navigation.navigate('Practice', topicSlug ? { topic: topicSlug } : undefined);
    return;
  }

  if (area === 'stack' && screen) {
    if (screen === 'AskAI') {
      navigateToAskAI(navigation);
      return;
    }

    const stackScreen = screen as keyof MainStackParamList;
    const paramKey = STACK_ID_PARAMS[stackScreen];

    if (paramKey && param) {
      if (stackScreen === 'GamePlay') {
        navigateMainStack(navigation, stackScreen, { gameId: param as GameId });
        return;
      }
      navigateMainStack(navigation, stackScreen, { [paramKey]: param });
      return;
    }

    if (STACK_NO_PARAM.includes(stackScreen)) {
      navigateMainStack(navigation, stackScreen);
      return;
    }

    if (stackScreen === 'Quiz' && param) {
      navigateMainStack(navigation, 'Quiz', { testId: param });
    }
  }
}

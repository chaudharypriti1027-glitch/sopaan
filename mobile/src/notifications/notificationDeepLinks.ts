import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

export type NotificationPayload = {
  type?: string;
  screen?: string;
  params?: Record<string, unknown>;
  testId?: string;
  attemptId?: string;
  digestId?: string;
  affairId?: string;
  seriesId?: string;
  date?: string;
  weekKey?: string;
  plan?: string;
  [key: string]: unknown;
};

export function navigateFromNotificationPayload(
  navigation: NativeStackNavigationProp<MainStackParamList>,
  payload: NotificationPayload,
) {
  const screen = payload.screen;
  const params = payload.params ?? {};

  switch (screen) {
    case 'CurrentAffairsTab':
      navigation.navigate('AppTabs', {
        screen: 'CurrentAffairs',
        params: {
          digestId: (params.digestId as string | undefined) ?? payload.digestId,
          affairId: (params.affairId as string | undefined) ?? payload.affairId,
        },
      });
      return;
    case 'StudyPlanner':
      navigation.navigate('StudyPlanner', {
        date: (params.date as string | undefined) ?? payload.date,
      });
      return;
    case 'TestSeries':
      navigation.navigate('TestSeries');
      return;
    case 'ProgressAnalytics':
      navigation.navigate('ProgressAnalytics');
      return;
    case 'Leaderboard':
      navigation.navigate('Leaderboard', {
        testId: (params.testId as string | undefined) ?? payload.testId,
      });
      return;
    case 'Rewards':
      navigation.navigate('Rewards');
      return;
    case 'Mentors':
      navigation.navigate('Mentors');
      return;
    case 'Premium':
      navigation.navigate('Premium');
      return;
    case 'MockAnalysis':
      if (payload.attemptId) {
        navigation.navigate('MockAnalysis', { attemptId: payload.attemptId });
        return;
      }
      break;
    case 'Result':
      break;
    default:
      break;
  }

  if (payload.type === 'rank_up' && payload.attemptId && payload.testId) {
    navigation.navigate('MockAnalysis', { attemptId: String(payload.attemptId) });
    return;
  }

  if (payload.type === 'mock_live' || payload.type === 'progress_recap') {
    navigation.navigate(payload.type === 'mock_live' ? 'TestSeries' : 'ProgressAnalytics');
    return;
  }

  if (payload.type === 'plan_ready' || payload.type === 'streak_reminder') {
    navigation.navigate('StudyPlanner');
    return;
  }

  if (payload.type === 'new_current_affairs') {
    navigation.navigate('AppTabs', { screen: 'CurrentAffairs' });
    return;
  }

  navigation.navigate('Notifications');
}

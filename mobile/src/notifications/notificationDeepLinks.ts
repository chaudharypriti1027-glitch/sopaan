import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppTabParamList, MainStackParamList } from '../navigation/types';

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

function getNavigationRef() {
  // Lazy require keeps Jest mocks that replace @react-navigation/native working.
  const { navigationRef } = require('../navigation/navigationRef') as {
    navigationRef: {
      isReady: () => boolean;
      getCurrentRoute: () => { name?: string } | undefined;
      dispatch: (action: ReturnType<typeof CommonActions.navigate>) => void;
    };
  };
  return navigationRef;
}

function openMainScreen(
  screen: keyof MainStackParamList,
  params?: MainStackParamList[keyof MainStackParamList],
) {
  const navigationRef = getNavigationRef();
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: { screen, params },
    }),
  );
  return true;
}

function openTab(
  screen: keyof AppTabParamList,
  params?: AppTabParamList[keyof AppTabParamList],
) {
  const navigationRef = getNavigationRef();
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'AppTabs',
        params: { screen, params },
      },
    }),
  );
  return true;
}

function runNotificationNavigation(payload: NotificationPayload) {
  if (payload.type === 'rank_up' && payload.attemptId) {
    openMainScreen('MockAnalysis', { attemptId: String(payload.attemptId) });
    return;
  }

  const screen = payload.screen;
  const params = payload.params ?? {};

  switch (screen) {
    case 'CurrentAffairsTab':
      openTab('CurrentAffairs', {
        digestId: (params.digestId as string | undefined) ?? payload.digestId,
        affairId: (params.affairId as string | undefined) ?? payload.affairId,
      });
      return;
    case 'StudyPlanner':
      openMainScreen('StudyPlanner', {
        date: (params.date as string | undefined) ?? payload.date,
      });
      return;
    case 'TestSeries':
      openMainScreen('TestSeries', {
        seriesId: (params.seriesId as string | undefined) ?? payload.seriesId,
      });
      return;
    case 'ProgressAnalytics':
      openMainScreen('ProgressAnalytics', {
        weekKey: (params.weekKey as string | undefined) ?? payload.weekKey,
      });
      return;
    case 'Leaderboard':
      openMainScreen('Leaderboard', {
        testId: (params.testId as string | undefined) ?? payload.testId,
      });
      return;
    case 'Rewards':
      openMainScreen('Rewards');
      return;
    case 'Mentors':
      openMainScreen('Mentors');
      return;
    case 'Premium':
      openMainScreen('Premium', {
        plan: (params.plan as string | undefined) ?? payload.plan,
      } as MainStackParamList['Premium']);
      return;
    case 'MockAnalysis': {
      const attemptId =
        (params.attemptId as string | undefined) ?? payload.attemptId;
      if (attemptId) {
        openMainScreen('MockAnalysis', { attemptId: String(attemptId) });
      }
      return;
    }
    case 'LiveClassViewer': {
      const liveClassId =
        (params.liveClassId as string | undefined) ??
        (payload.liveClassId as string | undefined);
      if (liveClassId) {
        openMainScreen('LiveClassViewer', { liveClassId: String(liveClassId) });
      }
      return;
    }
    case 'LiveClasses':
      openMainScreen('LiveClasses');
      return;
    default:
      break;
  }

  if (payload.type === 'mock_live' || payload.type === 'progress_recap') {
    if (payload.type === 'mock_live') {
      openMainScreen('TestSeries', {
        seriesId: payload.seriesId as string | undefined,
      });
    } else {
      openMainScreen('ProgressAnalytics', {
        weekKey: payload.weekKey as string | undefined,
      });
    }
    return;
  }

  if (payload.type === 'plan_ready' || payload.type === 'streak_reminder') {
    openMainScreen('StudyPlanner', {
      date: payload.date as string | undefined,
    });
    return;
  }

  if (payload.type === 'new_current_affairs') {
    openTab('CurrentAffairs', {
      digestId: payload.digestId as string | undefined,
      affairId: payload.affairId as string | undefined,
    });
    return;
  }

  if (payload.type === 'live_class_scheduled') {
    const liveClassId = payload.liveClassId as string | undefined;
    if (liveClassId) {
      openMainScreen('LiveClassViewer', { liveClassId: String(liveClassId) });
    } else {
      openMainScreen('LiveClasses');
    }
    return;
  }

  openMainScreen('Notifications');
}

/**
 * Navigate from a push payload after splash/bootstrap. Retries until the
 * navigator leaves Splash so Android cold starts do not open half-ready routes.
 */
export function navigateFromNotificationPayload(payload: NotificationPayload) {
  const attempt = (remaining: number) => {
    const navigationRef = getNavigationRef();
    if (!navigationRef.isReady()) {
      if (remaining > 0) {
        setTimeout(() => attempt(remaining - 1), 250);
      }
      return;
    }

    const routeName = navigationRef.getCurrentRoute()?.name;
    if (routeName === 'Splash' && remaining > 0) {
      setTimeout(() => attempt(remaining - 1), 300);
      return;
    }

    runNotificationNavigation(payload);
  };

  attempt(40);
}

/** @deprecated use navigateFromNotificationPayload — kept for typed screen navigation contexts. */
export function navigateFromNotificationPayloadWithNav(
  _navigation: NativeStackNavigationProp<MainStackParamList>,
  payload: NotificationPayload,
) {
  navigateFromNotificationPayload(payload);
}

export function openInAppNotification(
  _navigation: NativeStackNavigationProp<MainStackParamList>,
  notification: { type: string; data?: NotificationPayload | null },
) {
  const payload: NotificationPayload = {
    type: notification.type,
    ...(notification.data ?? {}),
  };

  navigateFromNotificationPayload(payload);
}

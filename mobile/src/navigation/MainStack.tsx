import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PREMIUM } from '../components/premium/premiumStyles';
import { lazyScreen } from './lazyScreen';
import type { MainStackParamList } from './types';
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  const { t } = useTranslation('navigation');

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: PREMIUM.bg },
        headerTintColor: PREMIUM.ink,
        contentStyle: { backgroundColor: PREMIUM.bg },
      }}
    >
      <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AskAI"
        getComponent={lazyScreen(() => require('../screens/app/AskAIScreen'), 'AskAIScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Quiz"
        getComponent={lazyScreen(() => require('../screens/app/QuizScreen'), 'QuizScreen')}
        options={{ title: t('quiz'), headerBackTitle: t('common:back') }}
      />
      <Stack.Screen
        name="Result"
        getComponent={lazyScreen(() => require('../screens/app/ResultScreen'), 'ResultScreen')}
        options={{ title: t('result'), headerShown: false }}
      />
      <Stack.Screen
        name="ProgressAnalytics"
        getComponent={lazyScreen(
          () => require('../screens/app/ProgressAnalyticsScreen'),
          'ProgressAnalyticsScreen',
        )}
        options={{ title: t('progressAnalytics') }}
      />
      <Stack.Screen
        name="ExamCalendar"
        getComponent={lazyScreen(() => require('../screens/app/ExamCalendarScreen'), 'ExamCalendarScreen')}
        options={{ title: t('examCalendar') }}
      />
      <Stack.Screen
        name="ExamDetail"
        getComponent={lazyScreen(() => require('../screens/app/ExamDetailScreen'), 'ExamDetailScreen')}
        options={{ title: t('examDetail') }}
      />
      <Stack.Screen
        name="Books"
        getComponent={lazyScreen(() => require('../screens/app/BooksScreen'), 'BooksScreen')}
        options={{ title: t('books') }}
      />
      <Stack.Screen
        name="Courses"
        getComponent={lazyScreen(() => require('../screens/app/CoursesScreen'), 'CoursesScreen')}
        options={{ title: t('courses') }}
      />
      <Stack.Screen
        name="CourseDetail"
        getComponent={lazyScreen(() => require('../screens/app/CourseDetailScreen'), 'CourseDetailScreen')}
        options={{ title: t('course') }}
      />
      <Stack.Screen
        name="LiveClasses"
        getComponent={lazyScreen(() => require('../screens/app/LiveClassesScreen'), 'LiveClassesScreen')}
        options={{ title: t('liveClasses') }}
      />
      <Stack.Screen
        name="LiveClassViewer"
        getComponent={lazyScreen(
          () => require('../screens/app/LiveClassViewerScreen'),
          'LiveClassViewerScreen',
        )}
        options={{ title: t('liveClass'), headerShown: false }}
      />
      <Stack.Screen
        name="CommunityTests"
        getComponent={lazyScreen(
          () => require('../screens/app/CommunityTestsScreen'),
          'CommunityTestsScreen',
        )}
        options={{ title: t('communityTests') }}
      />
      <Stack.Screen
        name="CreateTest"
        getComponent={lazyScreen(() => require('../screens/app/CreateTestScreen'), 'CreateTestScreen')}
        options={{ title: t('createTest') }}
      />
      <Stack.Screen
        name="StudyPlanner"
        getComponent={lazyScreen(() => require('../screens/app/StudyPlannerScreen'), 'StudyPlannerScreen')}
        options={{ title: t('studyPlanner') }}
      />
      <Stack.Screen
        name="FocusTimer"
        getComponent={lazyScreen(() => require('../screens/app/FocusTimerScreen'), 'FocusTimerScreen')}
        options={{ title: t('focusTimer') }}
      />
      <Stack.Screen
        name="Wellness"
        getComponent={lazyScreen(() => require('../screens/app/WellnessScreen'), 'WellnessScreen')}
        options={{ title: t('wellness') }}
      />
      <Stack.Screen
        name="Rewards"
        getComponent={lazyScreen(() => require('../screens/app/RewardsScreen'), 'RewardsScreen')}
        options={{ title: t('rewards') }}
      />
      <Stack.Screen
        name="ReferEarn"
        getComponent={lazyScreen(() => require('../screens/app/ReferEarnScreen'), 'ReferEarnScreen')}
        options={{ title: t('referEarn') }}
      />
      <Stack.Screen
        name="Forum"
        getComponent={lazyScreen(() => require('../screens/app/ForumScreen'), 'ForumScreen')}
        options={{ title: t('forum') }}
      />
      <Stack.Screen
        name="GroupChat"
        getComponent={lazyScreen(() => require('../screens/app/GroupChatScreen'), 'GroupChatScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Mentors"
        getComponent={lazyScreen(() => require('../screens/app/MentorsScreen'), 'MentorsScreen')}
        options={{ title: t('mentors') }}
      />
      <Stack.Screen
        name="MockAnalysis"
        getComponent={lazyScreen(() => require('../screens/app/MockAnalysisScreen'), 'MockAnalysisScreen')}
        options={{ title: t('mockAnalysis') }}
      />
      <Stack.Screen
        name="AnswerEvaluation"
        getComponent={lazyScreen(
          () => require('../screens/app/AnswerEvaluationScreen'),
          'AnswerEvaluationScreen',
        )}
        options={{ title: t('answerEvaluation') }}
      />
      <Stack.Screen
        name="CutoffsForms"
        getComponent={lazyScreen(
          () => require('../screens/app/CutoffsFormsScreen'),
          'CutoffsFormsScreen',
        )}
        options={{ title: t('cutoffsForms') }}
      />
      <Stack.Screen
        name="Flashcards"
        getComponent={lazyScreen(() => require('../screens/app/FlashcardsScreen'), 'FlashcardsScreen')}
        options={{ title: t('flashcards') }}
      />
      <Stack.Screen
        name="PhysicalTest"
        getComponent={lazyScreen(() => require('../screens/app/PhysicalTestScreen'), 'PhysicalTestScreen')}
        options={{ title: t('physicalTest') }}
      />
      <Stack.Screen
        name="Roadmap"
        getComponent={lazyScreen(() => require('../screens/app/RoadmapScreen'), 'RoadmapScreen')}
        options={{ title: t('roadmap') }}
      />
      <Stack.Screen
        name="Readiness"
        getComponent={lazyScreen(() => require('../screens/app/ReadinessScreen'), 'ReadinessScreen')}
        options={{ title: t('readiness') }}
      />
      <Stack.Screen
        name="TestSeries"
        getComponent={lazyScreen(() => require('../screens/app/TestSeriesScreen'), 'TestSeriesScreen')}
        options={{ title: t('testSeries') }}
      />
      <Stack.Screen
        name="RevisionCapsules"
        getComponent={lazyScreen(
          () => require('../screens/app/RevisionCapsulesScreen'),
          'RevisionCapsulesScreen',
        )}
        options={{ title: t('revisionCapsules') }}
      />
      <Stack.Screen
        name="Vocabulary"
        getComponent={lazyScreen(() => require('../screens/app/VocabularyScreen'), 'VocabularyScreen')}
        options={{ title: t('vocabulary') }}
      />
      <Stack.Screen
        name="Notifications"
        getComponent={lazyScreen(
          () => require('../screens/app/NotificationsScreen'),
          'NotificationsScreen',
        )}
        options={{ title: t('notifications') }}
      />
      <Stack.Screen
        name="Notes"
        getComponent={lazyScreen(() => require('../screens/app/NotesScreen'), 'NotesScreen')}
        options={{ title: t('notes') }}
      />
      <Stack.Screen
        name="Premium"
        getComponent={lazyScreen(() => require('../screens/app/PremiumScreen'), 'PremiumScreen')}
        options={{ title: t('premium') }}
      />
      <Stack.Screen
        name="ManageSubscription"
        getComponent={lazyScreen(
          () => require('../screens/app/ManageSubscriptionScreen'),
          'ManageSubscriptionScreen',
        )}
        options={{ title: t('manageSubscription') }}
      />
      <Stack.Screen
        name="Settings"
        getComponent={lazyScreen(() => require('../screens/app/SettingsScreen'), 'SettingsScreen')}
        options={{ title: t('settings') }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        getComponent={lazyScreen(() => require('../screens/app/PrivacyPolicyScreen'), 'PrivacyPolicyScreen')}
        options={{ title: t('privacyPolicy') }}
      />
      <Stack.Screen
        name="DeleteAccount"
        getComponent={lazyScreen(() => require('../screens/app/DeleteAccountScreen'), 'DeleteAccountScreen')}
        options={{ title: t('deleteAccount') }}
      />
      <Stack.Screen
        name="SuccessStories"
        getComponent={lazyScreen(
          () => require('../screens/app/SuccessStoriesScreen'),
          'SuccessStoriesScreen',
        )}
        options={{ title: t('successStories') }}
      />
      <Stack.Screen
        name="Leaderboard"
        getComponent={lazyScreen(() => require('../screens/app/LeaderboardScreen'), 'LeaderboardScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        getComponent={lazyScreen(() => require('../screens/app/SearchScreen'), 'SearchScreen')}
        options={{ title: t('search') }}
      />
      <Stack.Screen
        name="Games"
        getComponent={lazyScreen(() => require('../screens/app/GamesScreen'), 'GamesScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GamePlay"
        getComponent={lazyScreen(() => require('../screens/app/GamePlayScreen'), 'GamePlayScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CurrentAffairReader"
        getComponent={lazyScreen(
          () => require('../screens/app/CurrentAffairReaderScreen'),
          'CurrentAffairReaderScreen',
        )}
        options={{ title: t('currentAffairReader') }}
      />
    </Stack.Navigator>
  );
}

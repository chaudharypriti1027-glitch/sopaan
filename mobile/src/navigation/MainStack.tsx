import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { premiumStackScreenOptions } from '../components/premium/PremiumNavigationHeader';
import { lazyScreen } from './lazyScreen';
import { HIDDEN_STACK_HEADER } from './stackScreenOptions';
import type { MainStackParamList } from './types';
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  const { t } = useTranslation('navigation');

  return (
    <Stack.Navigator
      screenOptions={premiumStackScreenOptions()}
    >
      <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AskAI"
        getComponent={lazyScreen(() => require('../screens/app/AskAIScreen'), 'AskAIScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TestReady"
        getComponent={lazyScreen(() => require('../screens/app/TestReadyScreen'), 'TestReadyScreen')}
        options={{ headerShown: false, animation: 'fade_from_bottom' }}
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
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="ExamCalendar"
        getComponent={lazyScreen(() => require('../screens/app/ExamCalendarScreen'), 'ExamCalendarScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="ExamDetail"
        getComponent={lazyScreen(() => require('../screens/app/ExamDetailScreen'), 'ExamDetailScreen')}
        options={{ title: t('examDetail') }}
      />
      <Stack.Screen
        name="Books"
        getComponent={lazyScreen(() => require('../screens/app/BooksScreen'), 'BooksScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="BookReader"
        getComponent={lazyScreen(() => require('../screens/app/BookReaderScreen'), 'BookReaderScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Courses"
        getComponent={lazyScreen(() => require('../screens/app/CoursesScreen'), 'CoursesScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="CourseDetail"
        getComponent={lazyScreen(() => require('../screens/app/CourseDetailScreen'), 'CourseDetailScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="LiveClasses"
        getComponent={lazyScreen(() => require('../screens/app/LiveClassesScreen'), 'LiveClassesScreen')}
        options={HIDDEN_STACK_HEADER}
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
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="CreateTest"
        getComponent={lazyScreen(() => require('../screens/app/CreateTestScreen'), 'CreateTestScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="StudyPlanner"
        getComponent={lazyScreen(() => require('../screens/app/StudyPlannerScreen'), 'StudyPlannerScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="FocusTimer"
        getComponent={lazyScreen(() => require('../screens/app/FocusTimerScreen'), 'FocusTimerScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Wellness"
        getComponent={lazyScreen(() => require('../screens/app/WellnessScreen'), 'WellnessScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Rewards"
        getComponent={lazyScreen(() => require('../screens/app/RewardsScreen'), 'RewardsScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="ReferEarn"
        getComponent={lazyScreen(() => require('../screens/app/ReferEarnScreen'), 'ReferEarnScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Forum"
        getComponent={lazyScreen(() => require('../screens/app/ForumScreen'), 'ForumScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Friends"
        getComponent={lazyScreen(() => require('../screens/app/FriendsScreen'), 'FriendsScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Messages"
        getComponent={lazyScreen(() => require('../screens/app/MessagesScreen'), 'MessagesScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="DirectMessage"
        getComponent={lazyScreen(
          () => require('../screens/app/DirectMessageScreen'),
          'DirectMessageScreen',
        )}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupChat"
        getComponent={lazyScreen(() => require('../screens/app/GroupChatScreen'), 'GroupChatScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Mentors"
        getComponent={lazyScreen(() => require('../screens/app/MentorsScreen'), 'MentorsScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="MockAnalysis"
        getComponent={lazyScreen(() => require('../screens/app/MockAnalysisScreen'), 'MockAnalysisScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="AnswerEvaluation"
        getComponent={lazyScreen(
          () => require('../screens/app/AnswerEvaluationScreen'),
          'AnswerEvaluationScreen',
        )}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="CutoffsForms"
        getComponent={lazyScreen(
          () => require('../screens/app/CutoffsFormsScreen'),
          'CutoffsFormsScreen',
        )}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Flashcards"
        getComponent={lazyScreen(() => require('../screens/app/FlashcardsScreen'), 'FlashcardsScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="PhysicalTest"
        getComponent={lazyScreen(() => require('../screens/app/PhysicalTestScreen'), 'PhysicalTestScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="ExamPlan"
        getComponent={lazyScreen(() => require('../screens/app/ExamPlanScreen'), 'ExamPlanScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Roadmap"
        getComponent={lazyScreen(() => require('../screens/app/RoadmapScreen'), 'RoadmapScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Readiness"
        getComponent={lazyScreen(() => require('../screens/app/ReadinessScreen'), 'ReadinessScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="TestSeries"
        getComponent={lazyScreen(() => require('../screens/app/TestSeriesScreen'), 'TestSeriesScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="RevisionCapsules"
        getComponent={lazyScreen(
          () => require('../screens/app/RevisionCapsulesScreen'),
          'RevisionCapsulesScreen',
        )}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Vocabulary"
        getComponent={lazyScreen(() => require('../screens/app/VocabularyScreen'), 'VocabularyScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Notifications"
        getComponent={lazyScreen(
          () => require('../screens/app/NotificationsScreen'),
          'NotificationsScreen',
        )}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Notes"
        getComponent={lazyScreen(() => require('../screens/app/NotesScreen'), 'NotesScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Premium"
        getComponent={lazyScreen(() => require('../screens/app/PremiumScreen'), 'PremiumScreen')}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="ManageSubscription"
        getComponent={lazyScreen(
          () => require('../screens/app/ManageSubscriptionScreen'),
          'ManageSubscriptionScreen',
        )}
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Settings"
        getComponent={lazyScreen(() => require('../screens/app/SettingsScreen'), 'SettingsScreen')}
        options={HIDDEN_STACK_HEADER}
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
        options={HIDDEN_STACK_HEADER}
      />
      <Stack.Screen
        name="Leaderboard"
        getComponent={lazyScreen(() => require('../screens/app/LeaderboardScreen'), 'LeaderboardScreen')}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        getComponent={lazyScreen(() => require('../screens/app/SearchScreen'), 'SearchScreen')}
        options={HIDDEN_STACK_HEADER}
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
        options={HIDDEN_STACK_HEADER}
      />
    </Stack.Navigator>
  );
}

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SubmitTestResponse } from '../api/types';
import type { TierFeatureKey } from '../api/tier';
import type { GameId } from '../games/types';

export type PremiumPaywallParams = {
  feature?: TierFeatureKey;
  paywallTitle?: string;
  paywallMessage?: string;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  GoalSetup: undefined;
  ProfileSetup: undefined;
  Signup: undefined;
  Login: undefined;
  Otp: { phone: string };
  /** @deprecated use Otp */
  OtpLogin: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Practice: undefined;
  CurrentAffairs: { digestId?: string; affairId?: string } | undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  AskAI: undefined;
  Quiz: { testId: string };
  Result: {
    attemptId: string;
    testId: string;
    previousRank?: number;
    result: SubmitTestResponse;
  };
  ExamCalendar: undefined;
  ExamDetail: { examId?: string };
  Books: { examId?: string };
  Courses: undefined;
  CourseDetail: { courseId: string };
  LiveClasses: undefined;
  LiveClassViewer: { liveClassId: string };
  GroupChat: { groupId: string; groupName: string };
  CommunityTests: undefined;
  CreateTest: undefined;
  StudyPlanner: { date?: string } | undefined;
  FocusTimer: undefined;
  Wellness: undefined;
  ReferEarn: undefined;
  Rewards: undefined;
  Forum: undefined;
  Mentors: undefined;
  MockAnalysis: { attemptId?: string };
  AnswerEvaluation: undefined;
  CutoffsForms: undefined;
  Flashcards: undefined;
  PhysicalTest: undefined;
  Roadmap: undefined;
  Readiness: undefined;
  ProgressAnalytics: undefined;
  TestSeries: undefined;
  RevisionCapsules: undefined;
  Vocabulary: undefined;
  Notifications: undefined;
  Notes: undefined;
  Premium: PremiumPaywallParams | undefined;
  ManageSubscription: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  DeleteAccount: undefined;
  SuccessStories: undefined;
  Leaderboard: { testId?: string } | undefined;
  Search: undefined;
  Games: undefined;
  GamePlay: { gameId: GameId; sessionId?: number };
  CurrentAffairReader: { affairId: string };
  AdminDashboard: undefined;
  AdminContent: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { profileApi, type UpdateGoalInput, type UpdateProfileInput } from '../api';
import { confirmReferralOnboarding } from '../api/referrals';
import { trackExperimentEvent } from '../api/experiments';
import { getOrCreateInstallId } from '../referrals/referralStorage';
import { queryKeys } from '../hooks/queryKeys';
import type { ExamCategoryId } from './onboardingData';

export type OnboardingGoalDraft = UpdateGoalInput & {
  careerId?: string;
  careerLabel?: string;
};

export type OnboardingProfileDraft = UpdateProfileInput;

type OnboardingContextValue = {
  examCategory: ExamCategoryId | null;
  setExamCategory: (category: ExamCategoryId) => void;
  goal: OnboardingGoalDraft | null;
  setGoal: (goal: OnboardingGoalDraft) => void;
  profile: OnboardingProfileDraft | null;
  setProfile: (profile: OnboardingProfileDraft) => void;
  saveGoalToServer: (goal: OnboardingGoalDraft) => Promise<void>;
  saveProfileToServer: (profile: OnboardingProfileDraft) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type OnboardingProviderProps = {
  children: ReactNode;
};

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const queryClient = useQueryClient();
  const [examCategory, setExamCategoryState] = useState<ExamCategoryId | null>(null);
  const [goal, setGoalState] = useState<OnboardingGoalDraft | null>(null);
  const [profile, setProfileState] = useState<OnboardingProfileDraft | null>(null);

  const setExamCategory = useCallback((category: ExamCategoryId) => {
    setExamCategoryState(category);
  }, []);

  const setGoal = useCallback((nextGoal: OnboardingGoalDraft) => {
    setGoalState(nextGoal);
  }, []);

  const setProfile = useCallback((nextProfile: OnboardingProfileDraft) => {
    setProfileState(nextProfile);
  }, []);

  const saveGoalToServer = useCallback(async (nextGoal: OnboardingGoalDraft) => {
    setGoalState(nextGoal);
    await profileApi.updateGoal({
      examTrack: nextGoal.examTrack,
      targetYear: nextGoal.targetYear,
    });
  }, []);

  const saveProfileToServer = useCallback(async (nextProfile: OnboardingProfileDraft) => {
    setProfileState(nextProfile);
    await profileApi.updateProfile(nextProfile);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (goal) {
      await profileApi.updateGoal({
        examTrack: goal.examTrack,
        targetYear: goal.targetYear,
      });
    }

    if (profile) {
      await profileApi.updateProfile(profile);
    }

    try {
      await confirmReferralOnboarding();
    } catch {
      // non-blocking for users without a referral
    }

    try {
      const installId = await getOrCreateInstallId();
      await trackExperimentEvent({ installId, event: 'onboarding_complete' });
    } catch {
      // non-blocking experiment telemetry
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
  }, [goal, profile, queryClient]);

  const resetOnboarding = useCallback(() => {
    setExamCategoryState(null);
    setGoalState(null);
    setProfileState(null);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      examCategory,
      setExamCategory,
      goal,
      setGoal,
      profile,
      setProfile,
      saveGoalToServer,
      saveProfileToServer,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      examCategory,
      goal,
      profile,
      setExamCategory,
      setGoal,
      setProfile,
      saveGoalToServer,
      saveProfileToServer,
      completeOnboarding,
      resetOnboarding,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

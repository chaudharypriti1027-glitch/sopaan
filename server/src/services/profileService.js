import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Exam } from '../models/Exam.js';
import { AppError } from '../utils/AppError.js';
import { isReservedExamSentinel } from '../utils/examTrack.js';
import { buildRoadmap as buildAiRoadmap } from './ai/roadmap.js';
import { buildExamSearchQuery } from './roadmapService.js';
import { readinessForGoal } from './ai/coach.js';
import { markReferralOnboardingComplete } from './referralService.js';
import { syncProfileGoalToUser } from './goalSyncService.js';
import { bustHomeFeedCache } from './home/buildHomeFeed.js';
import {
  formatEntitlementDto,
  getEntitlementByUserId,
  syncUserPremiumFields,
} from './entitlementService.js';

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isPremium: user.isPremium,
    premiumPlan: user.premiumPlan ?? null,
    premiumExpiresAt: user.premiumExpiresAt ?? null,
    coins: user.coins,
    streak: user.streak,
    pushNotificationsEnabled: user.pushNotificationsEnabled ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function formatProfile(profile) {
  return {
    id: profile._id,
    userId: profile.userId,
    education: profile.education,
    category: profile.category,
    state: profile.state,
    attemptNumber: profile.attemptNumber,
    targetYear: profile.targetYear,
    goal: profile.goal,
    preferences: profile.preferences,
    completeness: profile.completeness,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function getOrCreateProfile(userId) {
  let profile = await StudentProfile.findOne({ userId });

  if (!profile) {
    profile = await StudentProfile.create({ userId });
  }

  return profile;
}

async function findExamByTrack(examTrack) {
  return Exam.findOne(buildExamSearchQuery(examTrack));
}

export async function getProfile(userId) {
  await syncUserPremiumFields(userId);

  const [user, profile, entitlement] = await Promise.all([
    User.findById(userId),
    getOrCreateProfile(userId),
    getEntitlementByUserId(userId),
  ]);

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return {
    user: formatUser(user),
    profile: formatProfile(profile),
    entitlement: formatEntitlementDto(entitlement),
  };
}

export async function updateProfile(userId, updates) {
  const profile = await getOrCreateProfile(userId);

  const scalarFields = ['education', 'category', 'state', 'attemptNumber', 'targetYear'];

  for (const field of scalarFields) {
    if (updates[field] !== undefined) {
      profile[field] = updates[field];
    }
  }

  if (updates.preferences) {
    profile.preferences = {
      ...(profile.preferences?.toObject?.() ?? profile.preferences ?? {}),
      ...updates.preferences,
    };
    profile.markModified('preferences');
  }

  profile.completeness = profile.computeCompleteness();
  await profile.save();

  if (profile.goal?.examTrack && profile.education) {
    await markReferralOnboardingComplete(userId);
  }

  const user = await User.findById(userId);

  return {
    user: formatUser(user),
    profile: formatProfile(profile),
  };
}

export async function updateGoal(userId, goal) {
  if (isReservedExamSentinel(goal.examTrack)) {
    throw new AppError('Enter your specific exam name', 400, 'VALIDATION_ERROR');
  }

  const profile = await getOrCreateProfile(userId);

  profile.goal = {
    examTrack: goal.examTrack,
    targetYear: goal.targetYear,
  };

  if (!profile.targetYear) {
    profile.targetYear = goal.targetYear;
  }

  profile.completeness = profile.computeCompleteness();
  await profile.save();

  if (profile.goal?.examTrack && profile.education) {
    await markReferralOnboardingComplete(userId);
  }

  const exam = await findExamByTrack(goal.examTrack);
  await syncProfileGoalToUser(userId, {
    examTrack: goal.examTrack,
    targetYear: goal.targetYear,
    examDate: exam?.importantDates?.find((item) => item.type === 'exam')?.date,
  });
  await bustHomeFeedCache(userId);

  const roadmap = await buildAiRoadmap({
    examTrack: goal.examTrack,
    targetYear: goal.targetYear,
    profile,
  });

  return {
    profile: formatProfile(profile),
    exam,
    roadmap,
  };
}

export async function getProfileReadiness(userId) {
  return readinessForGoal(userId);
}

export async function getGoalRoadmap(userId) {
  const profile = await getOrCreateProfile(userId);

  if (!profile?.goal?.examTrack) {
    throw new AppError('Set a goal before viewing roadmap', 400, 'GOAL_NOT_SET');
  }

  const exam = await findExamByTrack(profile.goal.examTrack);
  const roadmap = await buildAiRoadmap({
    examTrack: profile.goal.examTrack,
    targetYear: profile.goal.targetYear ?? profile.targetYear,
    profile,
  });

  return {
    profile: formatProfile(profile),
    exam,
    roadmap,
  };
}

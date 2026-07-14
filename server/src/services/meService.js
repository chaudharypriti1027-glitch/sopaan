import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { markReferralOnboardingComplete } from './referralService.js';
import { uploadAvatarImage } from './media/avatarStorage.js';
import { bustHomeFeedCache } from './home/buildHomeFeed.js';
import { syncUserGoal } from './goalSyncService.js';
import { CourseProgress } from '../models/CourseProgress.js';
import { Badge } from '../models/Badge.js';
import { Attempt } from '../models/Attempt.js';

function hasOnboardingCoreFields(user) {
  return Boolean(
    user.name?.trim() && user.state?.trim() && user.targetExam?.trim(),
  );
}

function handleDuplicateKeyError(err) {
  if (err?.code !== 11000) {
    throw err;
  }

  const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
  throw new AppError(`${field} is already registered`, 409, 'CONFLICT');
}

export async function getMe(userId) {
  const user = await User.findById(userId);

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return user.toProfile();
}

export async function getMeSummary(userId) {
  const user = await User.findById(userId).select('coins level rank streak xp accountStatus').lean();

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [courses, achievements, mistakesAgg, accuracyAgg] = await Promise.all([
    CourseProgress.countDocuments({ userId: userObjectId }),
    Badge.countDocuments({ userId: userObjectId }),
    Attempt.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: '$answers' },
      { $match: { 'answers.correct': false } },
      { $group: { _id: '$answers.questionId' } },
      { $count: 'total' },
    ]),
    Attempt.aggregate([
      { $match: { userId: userObjectId, accuracy: { $ne: null } } },
      { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } },
    ]),
  ]);

  const streakCurrent = user.streak?.current ?? user.streak?.count ?? 0;
  const avgAccuracy = accuracyAgg[0]?.avgAccuracy;

  return {
    courses,
    savedQuestions: 0,
    mistakes: mistakesAgg[0]?.total ?? 0,
    achievements,
    coins: user.coins ?? 0,
    downloads: 0,
    rank: user.rank ?? null,
    streak: streakCurrent,
    level: user.level ?? 1,
    accuracy: avgAccuracy != null ? Math.round(avgAccuracy) : null,
    xp: user.xp ?? 0,
  };
}

export async function updateMe(userId, updates) {
  const user = await User.findById(userId);

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (updates.name !== undefined) {
    user.name = updates.name;
  }

  if (updates.email !== undefined) {
    user.email = updates.email.toLowerCase();
  }

  if (updates.avatarUrl !== undefined) {
    user.avatarUrl = updates.avatarUrl?.trim() || undefined;
  }

  if (updates.state !== undefined) {
    user.state = updates.state;
  }

  if (updates.category !== undefined) {
    user.category = updates.category;
  }

  if (updates.targetExam !== undefined) {
    user.targetExam = updates.targetExam;
  }

  if (updates.examDate !== undefined) {
    user.examDate = updates.examDate === null ? undefined : new Date(updates.examDate);
  }

  if (updates.language !== undefined) {
    user.language = updates.language;
  }

  if (updates.educationLevel !== undefined) {
    user.educationLevel = updates.educationLevel;
  }

  const wasComplete = user.onboardingComplete;

  if (!user.onboardingComplete && hasOnboardingCoreFields(user)) {
    user.onboardingComplete = true;
  }

  try {
    await user.save();
  } catch (err) {
    handleDuplicateKeyError(err);
  }

  if (!wasComplete && user.onboardingComplete) {
    await markReferralOnboardingComplete(userId);
  }

  if (updates.targetExam !== undefined || updates.examDate !== undefined) {
    await syncUserGoal(userId);
    await bustHomeFeedCache(userId);
  }

  return user.toProfile();
}

export async function uploadMeAvatar(userId, file) {
  if (!file?.buffer) {
    throw new AppError('Avatar image is required', 400, 'VALIDATION_ERROR');
  }

  const avatarUrl = await uploadAvatarImage({
    userId,
    buffer: file.buffer,
    mimeType: file.mimetype,
  });

  const profile = await updateMe(userId, { avatarUrl });
  await bustHomeFeedCache(userId);
  return profile;
}

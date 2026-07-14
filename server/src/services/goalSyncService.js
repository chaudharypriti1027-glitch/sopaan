import { User } from '../models/User.js';
import { Goal } from '../models/Goal.js';
import { Exam } from '../models/Exam.js';
import { buildExamSearchQuery } from './roadmapService.js';
import { getOrCreateProfile } from './profileService.js';
import { normalizeExamTrack } from '../utils/examTrack.js';
import { resolveExamTrackForUser } from '../utils/resolveExamTrackForUser.js';

function resolveExamDate(user, exam) {
  if (user.examDate) {
    return new Date(user.examDate);
  }

  const now = new Date();
  const upcoming = (exam?.importantDates ?? [])
    .filter((item) => item.type === 'exam' && new Date(item.date) >= now)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  return upcoming[0] ? new Date(upcoming[0].date) : null;
}

async function upsertCustomGoal(user, examTrack, examDate) {
  let goal = user.activeGoalId ? await Goal.findById(user.activeGoalId) : null;

  if (!goal) {
    goal = await Goal.findOne({
      user: user._id,
      examName: examTrack,
      examId: { $exists: false },
    });
  }

  if (!goal) {
    goal = await Goal.create({
      user: user._id,
      examName: examTrack,
      examDate,
    });
  } else {
    let dirty = false;

    if (goal.examDate?.getTime() !== examDate.getTime()) {
      goal.examDate = examDate;
      dirty = true;
    }

    if (goal.examName !== examTrack) {
      goal.examName = examTrack;
      dirty = true;
    }

    if (dirty) {
      await goal.save();
    }
  }

  if (String(user.activeGoalId) !== String(goal._id)) {
    user.activeGoalId = goal._id;
    await user.save();
  }

  return goal;
}

/**
 * Keep User.activeGoalId, Goal, and StudentProfile.goal aligned from User.targetExam / examDate.
 */
export async function syncUserGoal(userId) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  const profile = await getOrCreateProfile(userId);
  const activeGoal = user.activeGoalId ? await Goal.findById(user.activeGoalId) : null;
  const examTrack = resolveExamTrackForUser(user, profile, activeGoal);

  if (!examTrack) {
    return null;
  }

  const exam = await Exam.findOne(buildExamSearchQuery(examTrack)).lean();
  const examDate = resolveExamDate(user, exam);

  if (!examDate) {
    return null;
  }

  const targetYear = examDate.getFullYear();
  let profileDirty = false;

  if (profile.goal?.examTrack !== examTrack) {
    profile.goal = {
      examTrack,
      targetYear: profile.goal?.targetYear ?? targetYear,
    };
    profileDirty = true;
  } else if (!profile.goal?.targetYear) {
    profile.goal = {
      ...profile.goal,
      targetYear,
    };
    profileDirty = true;
  }

  if (!profile.targetYear) {
    profile.targetYear = targetYear;
    profileDirty = true;
  }

  if (profileDirty) {
    profile.completeness = profile.computeCompleteness();
    await profile.save();
  }

  if (!exam?._id) {
    return upsertCustomGoal(user, examTrack, examDate);
  }

  const examName = exam.name ?? examTrack;
  let goal = user.activeGoalId ? await Goal.findById(user.activeGoalId) : null;

  if (!goal) {
    goal = await Goal.findOne({ user: userId, examId: exam._id });
  }

  if (!goal) {
    goal = await Goal.create({
      user: userId,
      examId: exam._id,
      examName,
      examDate,
    });
    user.activeGoalId = goal._id;
    await user.save();
    return goal;
  }

  let goalDirty = false;

  if (goal.examDate?.getTime() !== examDate.getTime()) {
    goal.examDate = examDate;
    goalDirty = true;
  }

  if (goal.examName !== examName) {
    goal.examName = examName;
    goalDirty = true;
  }

  if (goal.examId?.toString() !== exam._id.toString()) {
    goal.examId = exam._id;
    goalDirty = true;
  }

  if (goalDirty) {
    await goal.save();
  }

  if (String(user.activeGoalId) !== String(goal._id)) {
    user.activeGoalId = goal._id;
    await user.save();
  }

  return goal;
}

/**
 * Mirror StudentProfile goal fields onto User and refresh Goal document.
 */
export async function syncProfileGoalToUser(userId, { examTrack, targetYear, examDate }) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  const normalizedTrack = normalizeExamTrack(examTrack);

  if (!normalizedTrack) {
    return null;
  }

  let changed = false;

  if (user.targetExam !== normalizedTrack) {
    user.targetExam = normalizedTrack;
    changed = true;
  }

  if (examDate) {
    const next = new Date(examDate);

    if (!user.examDate || user.examDate.getTime() !== next.getTime()) {
      user.examDate = next;
      changed = true;
    }
  } else if (targetYear && !user.examDate) {
    const inferred = new Date(targetYear, 5, 1);
    user.examDate = inferred;
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return syncUserGoal(userId);
}

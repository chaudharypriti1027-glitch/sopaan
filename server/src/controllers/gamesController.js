import { CurrentAffair } from '../models/CurrentAffair.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { instantGameCoaching } from '../services/ai/gameCoach.js';
import { recordActivity, ACTIVITY_KINDS } from '../services/activity.js';
import { getMe } from '../services/meService.js';

export async function completeGame(req, res) {
  const { gameId, score, affairId, gameTitle, answers } = req.body;
  const safeScore = Math.min(100, Math.max(0, Math.floor(Number(score) || 0)));

  const activity = await recordActivity(req.user, ACTIVITY_KINDS.GAME_COMPLETE, {
    gameId,
    score: safeScore,
  });

  const [profile, affair, studentProfile] = await Promise.all([
    getMe(req.user._id),
    affairId ? CurrentAffair.findById(affairId).select('title').lean() : null,
    StudentProfile.findOne({ userId: req.user._id }).select('goal.examTrack').lean(),
  ]);

  const ai = instantGameCoaching({
    gameId,
    gameTitle,
    score: safeScore,
    answers: answers ?? [],
    affairTitle: affair?.title,
    examTrack: studentProfile?.goal?.examTrack,
  });

  res.status(200).json({
    coinsAwarded: activity?.rewards?.coins ?? 0,
    xpAwarded: activity?.rewards?.xp ?? 0,
    streak: activity?.streak,
    profile,
    coaching: ai.coaching,
    review: ai.review,
  });
}

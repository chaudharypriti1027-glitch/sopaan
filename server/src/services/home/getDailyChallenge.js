import { Attempt } from '../../models/Attempt.js';
import { DailyChallenge } from '../../models/DailyChallenge.js';
import { publishedContentFilter } from '../../models/publishableFields.js';
import { endOfIstDay, startOfIstDay } from '../../utils/date.js';
import { safeHomeCall } from './safe.js';

export async function getDailyChallenge(user) {
  return safeHomeCall('getDailyChallenge', async () => {
    if (!user?._id) {
      return null;
    }

    const now = new Date();
    const dayStart = startOfIstDay(now);
    const dayEnd = endOfIstDay(now);

    const challenge = await DailyChallenge.findOne({
      $and: [publishedContentFilter, { date: { $gte: dayStart, $lte: dayEnd } }],
    })
      .sort({ date: -1 })
      .lean();

    if (!challenge) {
      return null;
    }

    const completed = await Attempt.exists({
      userId: user._id,
      testId: challenge.testId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    return {
      id: challenge._id.toString(),
      title: challenge.title,
      qCount: challenge.qCount,
      rewardCoins: challenge.rewardCoins ?? 0,
      status: completed ? 'done' : 'todo',
    };
  }, null);
}

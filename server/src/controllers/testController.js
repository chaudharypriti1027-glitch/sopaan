import * as testService from '../services/testService.js';
import * as attemptService from '../services/attemptService.js';
import { recordActivity, ACTIVITY_KINDS } from '../services/activity.js';

export async function listTests(req, res) {
  const result = await testService.listTests(req.query, req.user);
  res.status(200).json(result);
}

export async function getTest(req, res) {
  const result = await testService.getTestForAttempt(req.params.id, req.user);
  res.status(200).json(result);
}

export async function submitTest(req, res) {
  const result = await attemptService.submitTest(req.user._id, req.params.id, req.body.answers);

  const activity = await recordActivity(req.user, ACTIVITY_KINDS.TEST_COMPLETE, {
    score: result.attempt?.score ?? 0,
  });

  res.status(201).json({
    ...result,
    rewards: {
      ...(result.rewards ?? {}),
      streak: activity?.streak,
      coinsAwarded: activity?.rewards?.coins ?? 0,
      xpAwarded: activity?.rewards?.xp ?? 0,
    },
  });
}

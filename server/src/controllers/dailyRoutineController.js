import * as dailyRoutineService from '../services/dailyRoutineService.js';

export async function getTodayRoutine(req, res) {
  const result = await dailyRoutineService.getDailyRoutine(req.user._id);
  res.status(200).json(result);
}

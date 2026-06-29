import { FocusLog } from '../models/FocusLog.js';
import { endOfDay, startOfDay } from '../utils/pagination.js';
import { handleFocusRewards } from './gamificationService.js';

export async function logFocus(userId, { focusMinutes, breaksTaken, sessions, date }) {
  const day = date ? startOfDay(date) : startOfDay(new Date());

  let log = await FocusLog.findOne({ userId, date: { $gte: day, $lte: endOfDay(day) } });

  if (!log) {
    log = new FocusLog({ userId, date: day });
  }

  log.focusMinutes = (log.focusMinutes ?? 0) + focusMinutes;
  log.breaksTaken = (log.breaksTaken ?? 0) + breaksTaken;
  log.sessionsCompleted = (log.sessionsCompleted ?? 0) + sessions;

  await log.save();

  const rewards = await handleFocusRewards(userId, sessions);

  return { log, rewards };
}

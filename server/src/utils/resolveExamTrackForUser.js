import { normalizeExamTrack } from './examTrack.js';

/**
 * Resolve the student's effective exam track from user, profile, and optional goal.
 */
export function resolveExamTrackForUser(user, profile, goal = null) {
  const candidates = [user?.targetExam, profile?.goal?.examTrack, goal?.examName];

  for (const value of candidates) {
    const normalized = normalizeExamTrack(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

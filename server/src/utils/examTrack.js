export const OTHER_EXAM_SENTINEL = 'Other';

export function normalizeExamTrack(value) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed || trimmed === OTHER_EXAM_SENTINEL) {
    return null;
  }

  return trimmed;
}

export function isReservedExamSentinel(value) {
  return !normalizeExamTrack(value);
}

import { OTHER_EXAM_VALUE, TARGET_EXAM_OPTIONS } from '../screens/profileSetup/constants';

export { OTHER_EXAM_VALUE };

const PREDEFINED_EXAM_VALUES: string[] = TARGET_EXAM_OPTIONS.map((option) => option.value).filter(
  (value) => value !== OTHER_EXAM_VALUE,
);

export function isOtherExamSelection(value: string): boolean {
  return value.trim() === OTHER_EXAM_VALUE;
}

export function isPredefinedExam(value: string): boolean {
  return PREDEFINED_EXAM_VALUES.includes(value.trim());
}

export function isReservedExamSentinel(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  return !trimmed || trimmed === OTHER_EXAM_VALUE;
}

/** Split stored target exam into grid selection + optional custom name. */
export function splitTargetExam(stored: string): { selection: string; customName: string } {
  const trimmed = stored.trim();

  if (!trimmed) {
    return { selection: '', customName: '' };
  }

  if (isPredefinedExam(trimmed)) {
    return { selection: trimmed, customName: '' };
  }

  if (isOtherExamSelection(trimmed)) {
    return { selection: OTHER_EXAM_VALUE, customName: '' };
  }

  return { selection: OTHER_EXAM_VALUE, customName: trimmed };
}

/** Resolve the value persisted to targetExam / examTrack. */
export function resolveTargetExam(selection: string, customName: string): string {
  if (isOtherExamSelection(selection)) {
    return customName.trim();
  }

  return selection.trim();
}

export function isValidTargetExam(selection: string, customName: string): boolean {
  const resolved = resolveTargetExam(selection, customName);
  return resolved.length >= 2;
}

export function displayExamName(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || isReservedExamSentinel(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Pomodoro focus timer configuration. */

export const FOCUS_TIMER_SECONDS = 25 * 60;
export const BREAK_TIMER_SECONDS = 5 * 60;
export const POMODORO_CYCLES = 4;

/** Break tip chips — labels via `focusTimer.*` i18n keys. */
export const FOCUS_BREAK_TIPS = [
  { id: 'stretch', labelKey: 'focusTimer.stretch' },
  { id: 'hydrate', labelKey: 'focusTimer.hydrate' },
  { id: 'eye-rest', labelKey: 'focusTimer.eyeRest' },
  { id: 'breathe', labelKey: 'focusTimer.breathe' },
] as const;

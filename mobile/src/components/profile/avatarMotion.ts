export const AVATAR_MOTION = {
  blinkCloseMs: 85,
  blinkHoldMs: 45,
  blinkOpenMs: 120,
  blinkMinIntervalMs: 2400,
  blinkMaxIntervalMs: 5200,
  breatheDurationMs: 3000,
  breatheScale: 1.02,
  shimmerDurationMs: 3800,
  ringPulseDurationMs: 3200,
} as const;

export function randomBlinkDelayMs() {
  const span = AVATAR_MOTION.blinkMaxIntervalMs - AVATAR_MOTION.blinkMinIntervalMs;
  return AVATAR_MOTION.blinkMinIntervalMs + Math.floor(Math.random() * span);
}

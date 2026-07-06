import { Easing } from 'react-native-reanimated';

export const PROFILE_MOTION = {
  revealDurationMs: 520,
  revealTranslateY: 16,
  revealBaseDelayMs: 80,
  revealStaggerMs: 65,
  countUpDurationMs: 1100,
  progressDurationMs: 1200,
  progressDelayMs: 400,
  avatarPopDurationMs: 600,
  haloDurationMs: 2800,
  sparkleDurationMs: 3400,
  badgePopDurationMs: 500,
  badgeStaggerMs: 100,
  easeOut: Easing.out(Easing.cubic),
  easePop: Easing.out(Easing.back(1.2)),
} as const;

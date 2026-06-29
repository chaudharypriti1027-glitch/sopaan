import { MIN_TOUCH_TARGET } from './constants';

type Insets = { top: number; right: number; bottom: number; left: number };

/** Expand touch area so a control visually smaller than 44px still meets the target. */
export function hitSlopForSize(width: number, height: number): Insets {
  const padX = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - width) / 2));
  const padY = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - height) / 2));
  return { top: padY, right: padX, bottom: padY, left: padX };
}

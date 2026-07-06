export const READ_ALOUD_SPEED_PRESETS = [
  { label: '0.75×', multiplier: 0.75, rate: 0.38, pitch: 1 },
  { label: '1×', multiplier: 1, rate: 0.5, pitch: 1 },
  { label: '1.25×', multiplier: 1.25, rate: 0.62, pitch: 1 },
  { label: '1.5×', multiplier: 1.5, rate: 0.75, pitch: 1 },
] as const;

export type ReadAloudSpeedPreset = (typeof READ_ALOUD_SPEED_PRESETS)[number];

export type ReadAloudStatus = 'idle' | 'playing' | 'paused';

export type ReadAloudPosition = {
  pageOrder: number;
  line: number;
  charIndex: number;
};

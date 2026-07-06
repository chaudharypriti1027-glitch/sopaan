/** Live class tokens — matches sopaan-live-class-clean.html */
export const LIVE = {
  navy: '#232A4D',
  navy2: '#2E3766',
  navyDeep: '#1A1F3B',
  stageMid: '#33407A',
  stageDeep: '#12162B',
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  sage: '#5F8A7B',
  sageLt: '#9BC4B4',
  red: '#E8503A',
  inkPin: '#3A2C10',
  glass: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassDark: 'rgba(0,0,0,0.4)',
  textMuted: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.55)',
  listBg: '#F4F1E9',
  listBgTop: '#EFEADE',
  listBgMid: '#E4DFD0',
  ink: '#1C1E2E',
  muted: '#87889A',
  faint: '#B3B4C2',
} as const;

export type LiveAvatarTone = 'gold' | 'navy' | 'sage';

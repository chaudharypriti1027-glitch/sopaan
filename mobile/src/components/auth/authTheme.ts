/** Premium auth tokens — dark navy canvas · cream forms · gold accents (SOPAAN Sign-in). */
export const AUTH_SPACING = {
  /** Logo → divider → title → subtitle */
  stack: 12,
  /** Header → form card → footer */
  section: 20,
  /** Terms, buttons, links within footer */
  footer: 12,
} as const;

export const AUTH_FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  /** Display wordmark — falls back to bold UI font if display font unavailable. */
  display: 'SpaceGrotesk_700Bold',
} as const;

export const AUTH_UI = {
  /** Full-screen navy canvas (reference Sign-in). */
  bg: '#131938',
  bgTop: '#1B2350',
  bgBottom: '#0F1430',
  canvasGradient: ['#131938', '#1B2350', '#0F1430'] as const,

  /** Elevated cream form surface on dark canvas. */
  card: '#F7F3EA',
  cardElevated: '#FFFFFF',
  ink: '#1C2142',
  muted: '#8B8FA3',
  faint: '#B3B4C2',
  label: '#41435A',

  /** Text sitting directly on the navy canvas. */
  onCanvas: '#F3EBD8',
  onCanvasMuted: 'rgba(233,222,196,0.8)',
  onCanvasFaint: 'rgba(228,216,190,0.55)',
  onCanvasDim: 'rgba(228,216,190,0.35)',

  border: 'rgba(240,212,136,0.16)',
  borderHover: 'rgba(240,212,136,0.32)',
  focus: '#E9C868',
  focusRing: 'rgba(212,175,55,0.22)',

  accent: '#1E2A55',
  accentDark: '#1C2142',
  accentDeep: '#2C3568',
  accentSoft: 'rgba(30,42,85,0.08)',

  gold: '#D4AF37',
  goldLt: '#F0D488',
  goldMid: '#C9992E',
  goldDeep: '#8A6420',
  goldSoft: 'rgba(240,212,136,0.12)',
  goldGlow: 'rgba(212,175,55,0.22)',
  goldButton: ['#8A6420', '#C9992E', '#F0D488', '#C9992E', '#8A6420'] as const,

  sage: '#5E9C7C',
  sageDeep: '#4C7A63',
  sageSoft: 'rgba(94,156,124,0.14)',

  /** @deprecated prefer canvasGradient */
  gradient: ['#131938', '#1B2350'] as const,

  cardRadius: 24,
  inputRadius: 16,
  btnRadius: 18,
  shadow: 'rgba(0,0,0,0.45)',
  shadowSm: 'rgba(0,0,0,0.28)',
} as const;

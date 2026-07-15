/** Premium auth tokens — aligned with HOME_UI / PREMIUM navy · cream · gold. */
export const AUTH_SPACING = {
  /** Logo → hairline → title → subtitle */
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
} as const;

export const AUTH_UI = {
  bg: '#F3EEE1',
  bgTop: '#F6F1E6',
  bgBottom: '#EDE7D8',
  card: '#FFFFFF',
  ink: '#1D2440',
  muted: '#8B8FA3',
  faint: '#B3B4C2',
  label: '#41435A',
  border: '#F0EBDD',
  borderHover: '#C0C4DB',
  focus: '#2C3568',
  focusRing: 'rgba(44,53,104,0.14)',
  accent: '#1E2A55',
  accentDark: '#1C2450',
  accentDeep: '#2C3568',
  gold: '#C9A24B',
  goldLt: '#E9CF8D',
  goldDeep: '#A67F2E',
  goldSoft: 'rgba(201,162,75,0.16)',
  goldGlow: 'rgba(201,162,75,0.28)',
  sage: '#5E9C7C',
  sageDeep: '#4C7A63',
  sageSoft: 'rgba(94,156,124,0.12)',
  accentSoft: 'rgba(30,42,85,0.08)',
  gradient: ['#2C3568', '#1C2450'] as const,
  cardRadius: 24,
  inputRadius: 16,
  btnRadius: 16,
  shadow: 'rgba(28,36,80,0.14)',
  shadowSm: 'rgba(28,36,80,0.12)',
} as const;

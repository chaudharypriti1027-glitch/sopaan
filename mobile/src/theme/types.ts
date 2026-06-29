import type { a11y, colors, radii, spacing, typographyScale } from './tokens';

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;

export type FontFamilyUi =
  | 'PlusJakartaSans_400Regular'
  | 'PlusJakartaSans_500Medium'
  | 'PlusJakartaSans_600SemiBold'
  | 'PlusJakartaSans_700Bold';

export type FontFamilyStat =
  | 'SpaceGrotesk_500Medium'
  | 'SpaceGrotesk_600SemiBold'
  | 'SpaceGrotesk_700Bold';

export type ThemeFonts = {
  ui: {
    regular: FontFamilyUi;
    medium: FontFamilyUi;
    semibold: FontFamilyUi;
    bold: FontFamilyUi;
  };
  stat: {
    medium: FontFamilyStat;
    semibold: FontFamilyStat;
    bold: FontFamilyStat;
  };
};

export type TextStylePreset = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

export type ThemeTypography = {
  scale: typeof typographyScale;
  fonts: ThemeFonts;
  presets: {
    display: TextStylePreset;
    h1: TextStylePreset;
    h2: TextStylePreset;
    h3: TextStylePreset;
    body: TextStylePreset;
    bodyMedium: TextStylePreset;
    caption: TextStylePreset;
    label: TextStylePreset;
    tabLabel: TextStylePreset;
    fabLabel: TextStylePreset;
    stat: TextStylePreset;
    statLarge: TextStylePreset;
    eyebrow: TextStylePreset;
  };
};

export type ThemeColors = {
  background: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  surface: {
    default: string;
    muted: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    link: string;
  };
  border: {
    default: string;
    subtle: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    onPrimary: string;
  };
  semantic: {
    success: string;
    successMuted: string;
    warning: string;
    warningMuted: string;
    error: string;
    errorMuted: string;
    info: string;
    infoMuted: string;
  };
  tabBar: {
    background: string;
    border: string;
    inactive: string;
    active: string;
  };
  fab: {
    background: string;
    foreground: string;
    shadow: string;
  };
  accent: {
    gold: string;
    goldMuted: string;
    goldOn: string;
    teal: string;
    tealMuted: string;
    tealOn: string;
    coral: string;
    coralMuted: string;
    coralOn: string;
  };
  shadow: {
    color: string;
  };
};

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  a11y: typeof a11y;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: ThemeTypography;
  shadows: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
};

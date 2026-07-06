export type ReaderThemeId = 'paper' | 'sepia' | 'dark';

export type ReaderThemeTokens = {
  id: ReaderThemeId;
  background: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  toolbarBg: string;
  toolbarBorder: string;
  highlight: string;
  progressTrack: string;
};

export const READER_THEMES: Record<ReaderThemeId, ReaderThemeTokens> = {
  paper: {
    id: 'paper',
    background: '#F7F3EA',
    text: '#232A4D',
    textMuted: '#6B7194',
    accent: '#C29A4E',
    accentSoft: '#F4EBD8',
    toolbarBg: 'rgba(247,243,234,0.96)',
    toolbarBorder: 'rgba(35,42,77,0.08)',
    highlight: 'rgba(194,154,78,0.28)',
    progressTrack: 'rgba(35,42,77,0.1)',
  },
  sepia: {
    id: 'sepia',
    background: '#F2E7D0',
    text: '#232A4D',
    textMuted: '#6B5E48',
    accent: '#A67C33',
    accentSoft: '#E8D9B8',
    toolbarBg: 'rgba(242,231,208,0.96)',
    toolbarBorder: 'rgba(35,42,77,0.1)',
    highlight: 'rgba(166,124,51,0.3)',
    progressTrack: 'rgba(35,42,77,0.12)',
  },
  dark: {
    id: 'dark',
    background: '#12162B',
    text: '#E9EBF3',
    textMuted: '#9AA0BC',
    accent: '#C29A4E',
    accentSoft: 'rgba(194,154,78,0.18)',
    toolbarBg: 'rgba(18,22,43,0.94)',
    toolbarBorder: 'rgba(233,235,243,0.1)',
    highlight: 'rgba(194,154,78,0.35)',
    progressTrack: 'rgba(233,235,243,0.12)',
  },
};

export const READER_LINE_SPACING_OPTIONS = [1.5, 1.7, 2] as const;
export const READER_FONT_SCALE_MIN = 0.85;
export const READER_FONT_SCALE_MAX = 1.35;
export const READER_FONT_SCALE_STEP = 0.05;
export const READER_BASE_FONT_SIZE = 17;
export const READER_HORIZONTAL_MARGIN = 28;
export const READER_VERTICAL_MARGIN = 32;
/** Matches server PRO_BOOK_PREVIEW_PAGES — free preview depth for Pro books. */
export const READER_PRO_PREVIEW_PAGES = 2;

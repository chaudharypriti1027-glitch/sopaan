import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  READER_FONT_SCALE_STEP,
  READER_LINE_SPACING_OPTIONS,
  type ReaderThemeId,
} from '../components/reader/readerTheme';

type ReaderSettingsState = {
  theme: ReaderThemeId;
  fontScale: number;
  lineSpacing: number;
  highlights: Record<string, number[]>;
};

type ReaderSettingsActions = {
  setTheme: (theme: ReaderThemeId) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  cycleLineSpacing: () => void;
  toggleHighlight: (bookId: string, pageOrder: number, line: number) => void;
  isHighlighted: (bookId: string, pageOrder: number, line: number) => boolean;
};

export type ReaderSettingsStore = ReaderSettingsState & ReaderSettingsActions;

function highlightKey(bookId: string, pageOrder: number) {
  return `${bookId}:${pageOrder}`;
}

export const useReaderSettings = create<ReaderSettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'paper',
      fontScale: 1,
      lineSpacing: 1.7,
      highlights: {},

      setTheme: (theme) => set({ theme }),

      increaseFont: () =>
        set((state) => ({
          fontScale: Math.min(READER_FONT_SCALE_MAX, state.fontScale + READER_FONT_SCALE_STEP),
        })),

      decreaseFont: () =>
        set((state) => ({
          fontScale: Math.max(READER_FONT_SCALE_MIN, state.fontScale - READER_FONT_SCALE_STEP),
        })),

      cycleLineSpacing: () =>
        set((state) => {
          const index = READER_LINE_SPACING_OPTIONS.indexOf(
            state.lineSpacing as (typeof READER_LINE_SPACING_OPTIONS)[number],
          );
          const next =
            READER_LINE_SPACING_OPTIONS[(index + 1) % READER_LINE_SPACING_OPTIONS.length];
          return { lineSpacing: next };
        }),

      toggleHighlight: (bookId, pageOrder, line) =>
        set((state) => {
          const key = highlightKey(bookId, pageOrder);
          const current = state.highlights[key] ?? [];
          const exists = current.includes(line);
          const nextLines = exists ? current.filter((value) => value !== line) : [...current, line];
          return {
            highlights: {
              ...state.highlights,
              [key]: nextLines,
            },
          };
        }),

      isHighlighted: (bookId, pageOrder, line) => {
        const key = highlightKey(bookId, pageOrder);
        return (get().highlights[key] ?? []).includes(line);
      },
    }),
    {
      name: 'sopaan_reader_settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        fontScale: state.fontScale,
        lineSpacing: state.lineSpacing,
        highlights: state.highlights,
      }),
    },
  ),
);

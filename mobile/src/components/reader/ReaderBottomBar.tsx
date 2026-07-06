import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumText } from '../NumText';
import { Text } from '../Text';
import type { ReaderThemeTokens } from './readerTheme';

type ReaderBottomBarProps = {
  chapterTitle: string;
  pageOrder: number;
  totalPages: number;
  progressPercent: number;
  theme: ReaderThemeTokens;
};

export function ReaderBottomBar({
  chapterTitle,
  pageOrder,
  totalPages,
  progressPercent,
  theme,
}: ReaderBottomBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

  return (
    <View style={styles.bar}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progressPercent))}%` }]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.chapter} numberOfLines={1}>
          {chapterTitle}
        </Text>
        <NumText style={styles.pageCount}>
          {pageOrder} / {totalPages}
        </NumText>
      </View>
    </View>
  );
}

function createStyles(theme: ReaderThemeTokens, bottomInset: number) {
  return StyleSheet.create({
    bar: {
      paddingTop: 10,
      paddingBottom: bottomInset + 12,
      paddingHorizontal: 24,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.toolbarBorder,
      backgroundColor: theme.toolbarBg,
      gap: 10,
    },
    track: {
      height: 3,
      borderRadius: 999,
      backgroundColor: theme.progressTrack,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.accent,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    chapter: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMuted,
    },
    pageCount: {
      fontSize: 13,
      color: theme.text,
    },
  });
}

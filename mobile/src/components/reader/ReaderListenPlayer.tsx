import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import type { ReadAloudSpeedPreset, ReadAloudStatus } from '../../features/reader';
import type { ReaderThemeTokens } from './readerTheme';

type ReaderListenPlayerProps = {
  visible: boolean;
  collapsed: boolean;
  bookTitle: string;
  chapterTitle: string;
  status: ReadAloudStatus;
  speed: ReadAloudSpeedPreset;
  chapterPercent: number;
  theme: ReaderThemeTokens;
  onToggleCollapsed: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onCycleSpeed: () => void;
  onStop: () => void;
};

export function ReaderListenPlayer({
  visible,
  collapsed,
  bookTitle,
  chapterTitle,
  status,
  speed,
  chapterPercent,
  theme,
  onToggleCollapsed,
  onPrevious,
  onNext,
  onTogglePlay,
  onCycleSpeed,
  onStop,
}: ReaderListenPlayerProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!visible) {
    return null;
  }

  const isPlaying = status === 'playing';

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.max(0, Math.min(100, chapterPercent))}%` }]} />
      </View>

      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          onPress={onToggleCollapsed}
          style={({ pressed }) => [styles.collapseButton, pressed && styles.pressed]}
        >
          {collapsed ? (
            <ChevronUp size={16} color={theme.textMuted} strokeWidth={2.2} />
          ) : (
            <ChevronDown size={16} color={theme.textMuted} strokeWidth={2.2} />
          )}
        </Pressable>

        {!collapsed ? (
          <View style={styles.meta}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {bookTitle}
            </Text>
            <Text style={styles.chapterTitle} numberOfLines={1}>
              {chapterTitle}
            </Text>
          </View>
        ) : (
          <Text style={styles.collapsedTitle} numberOfLines={1}>
            {chapterTitle}
          </Text>
        )}

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reader.listenPrevious')}
            onPress={onPrevious}
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
          >
            <SkipBack size={16} color={theme.text} strokeWidth={2.2} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? t('reader.listenPause') : t('reader.listenPlay')}
            onPress={onTogglePlay}
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
          >
            {isPlaying ? (
              <Pause size={18} color={theme.text} strokeWidth={2.4} />
            ) : (
              <Play size={18} color={theme.text} strokeWidth={2.4} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reader.listenNext')}
            onPress={onNext}
            style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}
          >
            <SkipForward size={16} color={theme.text} strokeWidth={2.2} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('reader.listenSpeed', { speed: speed.label })}
          onPress={onCycleSpeed}
          style={({ pressed }) => [styles.speedPill, pressed && styles.pressed]}
        >
          <NumText style={styles.speedText}>{speed.label}</NumText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('reader.listenStop')}
          onPress={onStop}
          style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
        >
          <X size={16} color={theme.textMuted} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReaderThemeTokens) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 92,
      borderRadius: 18,
      backgroundColor: theme.toolbarBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.toolbarBorder,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    track: {
      height: 3,
      backgroundColor: theme.progressTrack,
    },
    trackFill: {
      height: '100%',
      backgroundColor: theme.accent,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    collapseButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    meta: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    bookTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    chapterTitle: {
      fontSize: 11,
      color: theme.textMuted,
    },
    collapsedTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    controlButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    speedPill: {
      minWidth: 44,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
    },
    speedText: {
      fontSize: 11,
      color: theme.text,
    },
    stopButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
  });
}

import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ExternalLink, PlayCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

type LiveClassRecordingPlayerProps = {
  recordingUrl: string;
  title?: string;
};

export function LiveClassRecordingPlayer({ recordingUrl, title }: LiveClassRecordingPlayerProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const player = useVideoPlayer(recordingUrl, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    player.play();
  }, [player, recordingUrl]);

  return (
    <View style={styles.root}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        allowsFullscreen
        contentFit="contain"
      />
      {title ? (
        <View style={styles.caption}>
          <PlayCircle size={16} color={LIVE.goldLt} strokeWidth={1.9} />
          <Text style={styles.captionText} numberOfLines={2}>
            {title}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => void Linking.openURL(recordingUrl)}
        style={styles.externalBtn}
      >
        <ExternalLink size={14} color={LIVE.gold} strokeWidth={2} />
        <Text style={styles.externalLabel}>{t('openExternally')}</Text>
      </Pressable>
    </View>
  );
}

export function LiveClassRecordingLoading() {
  const { theme } = useTheme();
  const styles = useMemo(() => createLoadingStyles(theme), [theme]);
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });

  return (
    <View style={styles.root}>
      <ActivityIndicator color={LIVE.goldLt} size="large" />
      <Text style={styles.label}>{t('recordingLoading')}</Text>
    </View>
  );
}

function createLoadingStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      backgroundColor: LIVE.stageDeep,
    },
    label: {
      ...theme.typography.presets.body,
      color: LIVE.textMuted,
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: LIVE.stageDeep,
    },
    video: {
      flex: 1,
      width: '100%',
    },
    caption: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      bottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: LIVE.glassDark,
      borderWidth: 1,
      borderColor: LIVE.glassBorder,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    captionText: {
      ...theme.typography.presets.caption,
      color: '#FFFFFF',
      fontFamily: theme.typography.fonts.ui.semibold,
      flex: 1,
    },
    externalBtn: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginTop: 4,
    },
    externalLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.goldDeep,
    },
  });
}

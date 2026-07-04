import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { PlayCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';

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
          <PlayCircle size={16} color={theme.colors.brand.onPrimary} />
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
      <ActivityIndicator color={theme.colors.brand.primary} size="large" />
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
      backgroundColor: '#0b1020',
    },
    label: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0b1020',
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
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    captionText: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.onPrimary,
      flex: 1,
    },
    externalBtn: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    externalLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.primary,
    },
  });
}

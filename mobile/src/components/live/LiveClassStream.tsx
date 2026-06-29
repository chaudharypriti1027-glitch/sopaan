import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  isTrackReference,
  useTracks,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useTheme } from '../../theme';

export type LiveClassStreamProps = {
  url: string;
  token: string;
  role: 'host' | 'viewer';
};

function EducatorVideoStage() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  const educatorTrack = tracks.find(
    (track) => isTrackReference(track) && track.publication?.kind === Track.Kind.Video,
  );

  if (!educatorTrack || !isTrackReference(educatorTrack)) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={theme.colors.brand.primary} />
        <Text style={styles.waitingText}>Waiting for educator video…</Text>
      </View>
    );
  }

  return <VideoTrack trackRef={educatorTrack} style={styles.video} objectFit="contain" />;
}

export function LiveClassStream({ url, token, role }: LiveClassStreamProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    void AudioSession.startAudioSession();

    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio
      video={role === 'host'}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
    >
      <View style={styles.stage}>
        <EducatorVideoStage />
      </View>
    </LiveKitRoom>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: '#0b1020',
    },
    video: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    waiting: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    waitingText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}

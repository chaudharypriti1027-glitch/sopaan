import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  isTrackReference,
  useRoomContext,
  useTracks,
} from '@livekit/react-native';
import { ConnectionState, Room, RoomEvent, Track } from 'livekit-client';
import { useTheme } from '../../theme';

export type LiveClassStreamProps = {
  url: string;
  token: string;
  role: 'host' | 'viewer' | 'student';
  muteAllSignal?: number;
  instructorName?: string;
  topic?: string | null;
  title?: string;
};

function useStudentMuteAllListener(
  room: Room | null,
  role: LiveClassStreamProps['role'],
  muteAllSignal = 0,
) {
  useEffect(() => {
    if (!room || role === 'host' || muteAllSignal === 0) {
      return;
    }

    void room.localParticipant.setMicrophoneEnabled(false);
  }, [muteAllSignal, room, role]);

  useEffect(() => {
    if (!room || role === 'host') {
      return;
    }

    const onData = (payload: Uint8Array) => {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as { type?: string };
        if (parsed.type === 'mute_all') {
          void room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch {
        // ignore malformed host messages
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, role]);
}

function useRemoteMediaSubscriber(role: LiveClassStreamProps['role']) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room || role === 'host') {
      return;
    }

    const subscribeRemoteMedia = () => {
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (!publication.isSubscribed) {
            publication.setSubscribed(true);
          }
        }
      }
    };

    subscribeRemoteMedia();
    room.on(RoomEvent.TrackPublished, subscribeRemoteMedia);
    room.on(RoomEvent.ParticipantConnected, subscribeRemoteMedia);
    room.on(RoomEvent.TrackSubscribed, subscribeRemoteMedia);
    room.on(RoomEvent.Reconnected, subscribeRemoteMedia);

    return () => {
      room.off(RoomEvent.TrackPublished, subscribeRemoteMedia);
      room.off(RoomEvent.ParticipantConnected, subscribeRemoteMedia);
      room.off(RoomEvent.TrackSubscribed, subscribeRemoteMedia);
      room.off(RoomEvent.Reconnected, subscribeRemoteMedia);
    };
  }, [room, role]);
}

function EducatorVideoStage({
  instructorName,
  topic,
  title,
  connectionError,
}: {
  instructorName?: string;
  topic?: string | null;
  title?: string;
  connectionError?: string | null;
}) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState(room?.state ?? ConnectionState.Disconnected);

  useEffect(() => {
    if (!room) {
      return;
    }

    const onStateChange = (state: ConnectionState) => setConnectionState(state);
    room.on(RoomEvent.ConnectionStateChanged, onStateChange);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, onStateChange);
    };
  }, [room]);

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );
  const educatorTrack = tracks.find(
    (track) =>
      isTrackReference(track) &&
      track.publication?.kind === Track.Kind.Video &&
      !track.participant.isLocal,
  );

  const isConnecting =
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting;
  const waitingMessage =
    connectionError ??
    (isConnecting ? t('joining') : connectionState === ConnectionState.Connected ? t('waitingEducator') : t('joinFailed'));

  return (
    <View style={styles.stage}>
      {educatorTrack && isTrackReference(educatorTrack) ? (
        <VideoTrack trackRef={educatorTrack} style={styles.video} objectFit="cover" />
      ) : (
        <View style={styles.waiting}>
          {isConnecting ? <ActivityIndicator color={theme.colors.brand.primary} /> : null}
          <Text style={styles.waitingText}>{waitingMessage}</Text>
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.overlay}
        pointerEvents="none"
      >
        {title ? (
          <Text style={styles.overlayTitle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {instructorName ? (
          <Text style={styles.overlayInstructor} numberOfLines={1}>
            {instructorName}
          </Text>
        ) : null}
        {topic ? (
          <Text style={styles.overlayTopic} numberOfLines={2}>
            {topic}
          </Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function RoomMuteBridge({
  role,
  muteAllSignal,
}: {
  role: LiveClassStreamProps['role'];
  muteAllSignal: number;
}) {
  const room = useRoomContext();
  useStudentMuteAllListener(room, role, muteAllSignal);
  return null;
}

function RemoteMediaBridge({ role }: { role: LiveClassStreamProps['role'] }) {
  useRemoteMediaSubscriber(role);
  return null;
}

export function LiveClassStream({
  url,
  token,
  role,
  muteAllSignal = 0,
  instructorName,
  topic,
  title,
}: LiveClassStreamProps) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isHost = role === 'host';

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
      audio={isHost}
      video={isHost}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      onError={(err) => setConnectionError(err.message)}
      onConnected={() => setConnectionError(null)}
    >
      <RoomMuteBridge role={role} muteAllSignal={muteAllSignal} />
      <RemoteMediaBridge role={role} />
      <EducatorVideoStage
        instructorName={instructorName}
        topic={topic}
        title={title}
        connectionError={connectionError}
      />
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
      ...StyleSheet.absoluteFillObject,
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
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      paddingTop: theme.spacing['3xl'],
      gap: theme.spacing.xs,
    },
    overlayTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: '#fff',
    },
    overlayInstructor: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.92)',
    },
    overlayTopic: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.75)',
    },
  });
}

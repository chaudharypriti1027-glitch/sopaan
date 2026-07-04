import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ConnectionState, Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import { useTheme } from '../../theme';
import { isDevStreamingUrl } from '../../utils/streaming';
import type { LiveClassStreamProps } from './LiveClassStream';

function subscribeExistingRemoteTracks(
  room: Room,
  attachVideo: (track: RemoteTrack) => void,
  attachAudio: (track: RemoteTrack) => void,
) {
  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.trackPublications.values()) {
      if (!publication.track || !publication.isSubscribed) {
        if (!publication.isSubscribed) {
          publication.setSubscribed(true);
        }
        continue;
      }

      const track = publication.track as RemoteTrack;
      if (publication.kind === Track.Kind.Video) {
        attachVideo(track);
      } else if (publication.kind === Track.Kind.Audio) {
        attachAudio(track);
      }
    }
  }
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
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (!url || !token || isDevStreamingUrl(url)) {
      return;
    }

    let cancelled = false;
    const room = new Room({ adaptiveStream: true });
    roomRef.current = room;

    const attachRemoteVideo = (track: RemoteTrack) => {
      const element = videoRef.current;
      if (!element || track.kind !== Track.Kind.Video) {
        return;
      }

      track.attach(element);
      setHasVideo(true);
    };

    const attachRemoteAudio = (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) {
        return;
      }

      track.attach();
    };

    const onTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video) {
        attachRemoteVideo(track);
        return;
      }

      attachRemoteAudio(track);
    };

    const onTrackUnsubscribed = (track: RemoteTrack) => {
      track.detach();
      if (track.kind === Track.Kind.Video) {
        setHasVideo(false);
      }
    };

    const onConnectionState = (state: ConnectionState) => {
      if (!cancelled) {
        setConnectionState(state);
      }
    };

    const onData = (payload: Uint8Array) => {
      if (role === 'host' || muteAllSignal === 0) {
        return;
      }

      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as { type?: string };
        if (parsed.type === 'mute_all') {
          void room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch {
        // ignore
      }
    };

    const onTrackPublished = () => {
      subscribeExistingRemoteTracks(room, attachRemoteVideo, attachRemoteAudio);
    };

    const onParticipantConnected = () => {
      subscribeExistingRemoteTracks(room, attachRemoteVideo, attachRemoteAudio);
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ConnectionStateChanged, onConnectionState);
    room.on(RoomEvent.DataReceived, onData);

    void room
      .connect(url, token)
      .then(() => {
        if (cancelled) {
          return;
        }

        subscribeExistingRemoteTracks(room, attachRemoteVideo, attachRemoteAudio);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('joinFailed'));
        }
      });

    return () => {
      cancelled = true;
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.off(RoomEvent.TrackPublished, onTrackPublished);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ConnectionStateChanged, onConnectionState);
      room.off(RoomEvent.DataReceived, onData);
      void room.disconnect();
      roomRef.current = null;
    };
  }, [muteAllSignal, role, t, token, url]);

  useEffect(() => {
    if (!roomRef.current || role === 'host' || muteAllSignal === 0) {
      return;
    }

    void roomRef.current.localParticipant.setMicrophoneEnabled(false);
  }, [muteAllSignal, role]);

  const isConnecting =
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting;
  const waitingMessage =
    error ??
    (isConnecting ? t('joining') : connectionState === ConnectionState.Connected ? t('waitingEducator') : t('joinFailed'));

  return (
    <View style={styles.stage}>
      {/* eslint-disable-next-line react/no-unknown-property -- web-only video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#0b1020',
        }}
      />

      {!hasVideo ? (
        <View style={styles.waiting}>
          {isConnecting ? <ActivityIndicator color={theme.colors.brand.primary} /> : null}
          <Text style={styles.waitingText}>{waitingMessage}</Text>
        </View>
      ) : null}

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

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: '#0b1020',
      position: 'relative',
    },
    waiting: {
      ...StyleSheet.absoluteFillObject,
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

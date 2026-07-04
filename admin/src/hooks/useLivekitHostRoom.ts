import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  createLocalScreenTracks,
  type LocalTrack,
  type LocalTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';

export type RoomParticipant = {
  identity: string;
  name: string;
  isLocal: boolean;
};

export function useLivekitHostRoom(credentials: { url: string; token: string } | null) {
  const roomRef = useRef<Room | null>(null);
  const screenTracksRef = useRef<LocalTrack[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [displayTrack, setDisplayTrack] = useState<LocalTrack | null>(null);

  const syncParticipants = useCallback((room: Room) => {
    setParticipantCount(room.numParticipants);

    const remote = Array.from(room.remoteParticipants.values()).map((participant: RemoteParticipant) => ({
      identity: participant.identity,
      name: participant.name || participant.identity,
      isLocal: false,
    }));

    setParticipants([
      {
        identity: room.localParticipant.identity,
        name: room.localParticipant.name || 'You',
        isLocal: true,
      },
      ...remote,
    ]);
  }, []);

  const refreshDisplayTrack = useCallback((room: Room) => {
    const local = room.localParticipant;
    const screenPub = local.getTrackPublication(Track.Source.ScreenShare);
    if (screenPub?.track) {
      setDisplayTrack(screenPub.track as LocalTrack);
      return;
    }

    const cameraPub = local.getTrackPublication(Track.Source.Camera);
    if (cameraPub?.track && local.isCameraEnabled) {
      setDisplayTrack(cameraPub.track as LocalTrack);
      return;
    }

    setDisplayTrack(null);
  }, []);

  useEffect(() => {
    if (!credentials?.url || !credentials.token) {
      return;
    }

    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;
    setConnecting(true);
    setError(null);

    const onConnected = async () => {
      if (cancelled) {
        return;
      }

      setConnected(true);
      setConnecting(false);

      try {
        await room.localParticipant.enableCameraAndMicrophone();
        setMicEnabled(room.localParticipant.isMicrophoneEnabled);
        setCameraEnabled(room.localParticipant.isCameraEnabled);
        syncParticipants(room);
        refreshDisplayTrack(room);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to start camera or microphone');
      }
    };

    const onDisconnected = () => {
      setConnected(false);
      setConnecting(false);
      setDisplayTrack(null);
    };

    const onParticipantChange = () => {
      syncParticipants(room);
    };

    const onLocalTrackPublished = (publication: LocalTrackPublication) => {
      if (
        publication.source === Track.Source.Camera ||
        publication.source === Track.Source.ScreenShare
      ) {
        refreshDisplayTrack(room);
      }
    };

    const onLocalTrackUnpublished = (publication: LocalTrackPublication) => {
      if (
        publication.source === Track.Source.Camera ||
        publication.source === Track.Source.ScreenShare
      ) {
        refreshDisplayTrack(room);
      }
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantChange);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantChange);
    room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
    room.on(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);

    void room.connect(credentials.url, credentials.token).catch((err) => {
      if (!cancelled) {
        setConnecting(false);
        setError(err instanceof Error ? err.message : 'Failed to connect to LiveKit');
      }
    });

    return () => {
      cancelled = true;
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.ParticipantConnected, onParticipantChange);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantChange);
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);
      void room.disconnect();
      roomRef.current = null;
      screenTracksRef.current = [];
    };
  }, [credentials?.url, credentials?.token, refreshDisplayTrack, syncParticipants]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
    refreshDisplayTrack(room);
  }, [refreshDisplayTrack]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    if (screenEnabled) {
      for (const track of screenTracksRef.current) {
        await room.localParticipant.unpublishTrack(track, true);
        track.stop();
      }
      screenTracksRef.current = [];
      setScreenEnabled(false);
      refreshDisplayTrack(room);
      return;
    }

    try {
      const tracks = await createLocalScreenTracks({ audio: false });
      screenTracksRef.current = tracks;

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
      }

      setScreenEnabled(true);
      refreshDisplayTrack(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screen share was blocked');
    }
  }, [refreshDisplayTrack, screenEnabled]);

  const muteAll = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return false;
    }

    const payload = new TextEncoder().encode(JSON.stringify({ type: 'mute_all' }));
    await room.localParticipant.publishData(payload, { reliable: true, topic: 'moderation' });
    return true;
  }, []);

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    await room.disconnect();
    roomRef.current = null;
    setConnected(false);
    setDisplayTrack(null);
  }, []);

  return {
    connected,
    connecting,
    error,
    devMode: false as const,
    micEnabled,
    cameraEnabled,
    screenEnabled,
    participantCount,
    participants,
    displayTrack,
    mediaStream: null,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    muteAll,
    disconnect,
  };
}

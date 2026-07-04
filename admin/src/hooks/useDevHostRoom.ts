import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomParticipant } from './useLivekitHostRoom';

export function useDevHostRoom(credentials: { url: string; token: string } | null) {
  const devStreamRef = useRef<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const stopDevStream = useCallback(() => {
    devStreamRef.current?.getTracks().forEach((track) => track.stop());
    devStreamRef.current = null;
    setMediaStream(null);
    setConnected(false);
    setScreenEnabled(false);
  }, []);

  useEffect(() => {
    if (!credentials?.url || !credentials.token) {
      return;
    }

    let cancelled = false;
    setConnecting(true);
    setError(null);

    void navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        devStreamRef.current = stream;
        setMediaStream(stream);
        setConnected(true);
        setConnecting(false);
        setMicEnabled(stream.getAudioTracks().every((track) => track.enabled));
        setCameraEnabled(stream.getVideoTracks().every((track) => track.enabled));
        setParticipantCount(1);
        setParticipants([{ identity: 'host', name: 'You', isLocal: true }]);
      })
      .catch((err) => {
        if (!cancelled) {
          setConnecting(false);
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to access camera or microphone in dev streaming mode',
          );
        }
      });

    return () => {
      cancelled = true;
      stopDevStream();
    };
  }, [credentials?.token, credentials?.url, stopDevStream]);

  const toggleMic = useCallback(async () => {
    const stream = devStreamRef.current;
    if (!stream) {
      return;
    }

    const next = !stream.getAudioTracks().every((track) => track.enabled);
    stream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicEnabled(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const stream = devStreamRef.current;
    if (!stream) {
      return;
    }

    const next = !stream.getVideoTracks().every((track) => track.enabled);
    stream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const stream = devStreamRef.current;
    if (!stream) {
      return;
    }

    if (screenEnabled) {
      stream.getVideoTracks().forEach((track) => {
        if (track.label.toLowerCase().includes('screen')) {
          track.stop();
        }
      });
      setScreenEnabled(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        return;
      }

      const currentVideo = stream.getVideoTracks()[0];
      if (currentVideo) {
        stream.removeTrack(currentVideo);
        currentVideo.stop();
      }

      stream.addTrack(screenTrack);
      setMediaStream(new MediaStream(stream.getTracks()));
      setScreenEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screen share was blocked');
    }
  }, [screenEnabled]);

  const muteAll = useCallback(async () => false, []);

  const disconnect = useCallback(async () => {
    stopDevStream();
  }, [stopDevStream]);

  return {
    connected,
    connecting,
    error,
    devMode: true as const,
    micEnabled,
    cameraEnabled,
    screenEnabled,
    participantCount,
    participants,
    displayTrack: null,
    mediaStream,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    muteAll,
    disconnect,
  };
}

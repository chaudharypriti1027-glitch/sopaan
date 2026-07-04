import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth';
import { getAccessToken } from '../lib/secure';
import { connectLiveSocket, getLiveSocket } from '../realtime/liveSocket';
import { LIVE_NS_EVENTS } from '../realtime/events';
import type { DevStreamSignalPayload } from '../utils/devStreamTypes';
import { DEV_STREAM_ICE_SERVERS } from '../utils/webrtcIce';

const REQUEST_RETRY_MS = 8_000;
const MAX_REQUEST_RETRIES = 6;

export type DevStreamConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

type DevPeerConnection = {
  close: () => void;
  connectionState?: string;
  ontrack: ((event: RTCTrackEvent) => void) | null;
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
  onconnectionstatechange: (() => void) | null;
  setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
  createAnswer: () => Promise<RTCSessionDescriptionInit>;
  setLocalDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
};

export type PeerFactory = () => DevPeerConnection;

export function useDevStreamViewer(
  classId: string,
  createPeer: PeerFactory,
  onRemoteStream: (stream: MediaStream) => void,
) {
  const { isAuthenticated } = useAuth();
  const peerRef = useRef<DevPeerConnection | null>(null);
  const requestTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestAttemptsRef = useRef(0);
  const createPeerRef = useRef(createPeer);
  const onRemoteStreamRef = useRef(onRemoteStream);
  const [connectionState, setConnectionState] = useState<DevStreamConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  createPeerRef.current = createPeer;
  onRemoteStreamRef.current = onRemoteStream;

  const clearRequestTimer = useCallback(() => {
    if (requestTimerRef.current) {
      clearInterval(requestTimerRef.current);
      requestTimerRef.current = null;
    }
  }, []);

  const cleanupPeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
  }, []);

  const requestStream = useCallback(() => {
    getLiveSocket()?.emit(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, { classId });
  }, [classId]);

  const scheduleRequestRetries = useCallback(() => {
    clearRequestTimer();
    requestAttemptsRef.current = 0;

    requestTimerRef.current = setInterval(() => {
      requestAttemptsRef.current += 1;
      if (requestAttemptsRef.current > MAX_REQUEST_RETRIES) {
        clearRequestTimer();
        setConnectionState('failed');
        setError('Educator stream is not available. Ask them to restart the class.');
        return;
      }

      requestStream();
    }, REQUEST_RETRY_MS);
  }, [clearRequestTimer, requestStream]);

  const retry = useCallback(() => {
    cleanupPeer();
    setConnectionState('connecting');
    setError(null);
    requestAttemptsRef.current = 0;
    requestStream();
    scheduleRequestRetries();
  }, [cleanupPeer, requestStream, scheduleRequestRetries]);

  useEffect(() => {
    if (!isAuthenticated || !classId) {
      return;
    }

    let cancelled = false;
    setConnectionState('connecting');
    setError(null);

    const emitSignal = (
      toUserId: string,
      type: DevStreamSignalPayload['type'],
      data: RTCSessionDescriptionInit | RTCIceCandidateInit,
    ) => {
      getLiveSocket()?.emit(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, {
        classId,
        toUserId,
        type,
        data,
      });
    };

    const handleSignal = async (payload: DevStreamSignalPayload) => {
      if (payload.classId !== classId || cancelled) {
        return;
      }

      try {
        if (payload.type === 'offer') {
          cleanupPeer();

          const peer = createPeerRef.current();
          peerRef.current = peer;

          peer.ontrack = (event: RTCTrackEvent) => {
            const [stream] = event.streams;
            if (stream) {
              clearRequestTimer();
              setConnectionState('connected');
              setError(null);
              onRemoteStreamRef.current(stream);
            }
          };

          peer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (!event.candidate) {
              return;
            }

            emitSignal('host', 'ice', event.candidate.toJSON());
          };

          peer.onconnectionstatechange = () => {
            if (
              peer.connectionState === 'failed' ||
              peer.connectionState === 'disconnected'
            ) {
              cleanupPeer();
              setConnectionState('connecting');
              scheduleRequestRetries();
            }
          };

          const offer = payload.data as RTCSessionDescriptionInit;
          await peer.setRemoteDescription(offer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          emitSignal('host', 'answer', answer);
        } else if (payload.type === 'ice' && peerRef.current) {
          await peerRef.current.addIceCandidate(payload.data as RTCIceCandidateInit);
        }
      } catch (err) {
        if (!cancelled) {
          cleanupPeer();
          setConnectionState('failed');
          setError(err instanceof Error ? err.message : 'Failed to connect to live stream');
        }
      }
    };

    const onSocketError = ({ message }: { message?: string }) => {
      if (!cancelled) {
        setConnectionState('failed');
        setError(message ?? 'Unable to join live stream');
      }
    };

    void (async () => {
      try {
        await connectLiveSocket(getAccessToken);
        const socket = getLiveSocket();

        if (!socket || cancelled) {
          return;
        }

        const onConnected = () => {
          socket.emit(LIVE_NS_EVENTS.JOIN, { classId });
          requestStream();
          scheduleRequestRetries();
        };

        socket.on(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, handleSignal);
        socket.on(LIVE_NS_EVENTS.ERROR, onSocketError);

        if (socket.connected) {
          onConnected();
        } else {
          socket.once('connect', onConnected);
        }
      } catch (err) {
        if (!cancelled) {
          setConnectionState('failed');
          setError(err instanceof Error ? err.message : 'Failed to join live stream');
        }
      }
    })();

    return () => {
      cancelled = true;
      clearRequestTimer();
      const socket = getLiveSocket();
      socket?.off(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, handleSignal);
      socket?.off(LIVE_NS_EVENTS.ERROR, onSocketError);
      cleanupPeer();
      setConnectionState('idle');
    };
  }, [
    classId,
    cleanupPeer,
    clearRequestTimer,
    isAuthenticated,
    requestStream,
    scheduleRequestRetries,
  ]);

  return {
    connectionState,
    error,
    retry,
    isConnecting: connectionState === 'connecting',
    isConnected: connectionState === 'connected',
    isFailed: connectionState === 'failed',
  };
}

export function createDevStreamPeerConnection(): DevPeerConnection {
  return new RTCPeerConnection({ iceServers: DEV_STREAM_ICE_SERVERS }) as unknown as DevPeerConnection;
}

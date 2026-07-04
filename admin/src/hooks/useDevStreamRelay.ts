import { useEffect, useRef } from 'react';
import { LIVE_NS_EVENTS } from '../realtime/events';
import { getLiveSocket } from '../realtime/liveSocket';
import { DEV_STREAM_ICE_SERVERS } from '../utils/webrtcIce';

type DevStreamSignalPayload = {
  classId: string;
  fromUserId: string;
  type: 'offer' | 'answer' | 'ice';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

function syncPeerTracks(peer: RTCPeerConnection, mediaStream: MediaStream) {
  const senders = peer.getSenders();
  const tracks = mediaStream.getTracks();

  for (const track of tracks) {
    const sender = senders.find((item) => item.track?.kind === track.kind);
    if (sender) {
      void sender.replaceTrack(track);
    } else {
      peer.addTrack(track, mediaStream);
    }
  }

  for (const sender of senders) {
    if (sender.track && !tracks.some((track) => track.id === sender.track?.id)) {
      void sender.replaceTrack(null);
    }
  }
}

export function useDevStreamRelay({
  classId,
  mediaStream,
  enabled,
}: {
  classId: string;
  mediaStream: MediaStream | null;
  enabled: boolean;
}) {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mediaStreamRef = useRef(mediaStream);

  mediaStreamRef.current = mediaStream;

  useEffect(() => {
    if (!enabled || !mediaStream || !classId) {
      return;
    }

    const socket = getLiveSocket();

    if (!socket) {
      return;
    }

    const closePeer = (viewerUserId: string) => {
      const peer = peersRef.current.get(viewerUserId);
      if (peer) {
        peer.close();
        peersRef.current.delete(viewerUserId);
      }
    };

    const createOfferForViewer = async (viewerUserId: string) => {
      const stream = mediaStreamRef.current;
      if (!stream) {
        return;
      }

      let peer = peersRef.current.get(viewerUserId);

      if (peer && peer.connectionState !== 'closed') {
        syncPeerTracks(peer, stream);
        const offer = await peer.createOffer({ iceRestart: true });
        await peer.setLocalDescription(offer);
        socket.emit(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, {
          classId,
          toUserId: viewerUserId,
          type: 'offer',
          data: offer,
        });
        return;
      }

      if (peer) {
        closePeer(viewerUserId);
      }

      peer = new RTCPeerConnection({ iceServers: DEV_STREAM_ICE_SERVERS });
      peersRef.current.set(viewerUserId, peer);

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        socket.emit(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, {
          classId,
          toUserId: viewerUserId,
          type: 'ice',
          data: event.candidate.toJSON(),
        });
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'failed') {
          closePeer(viewerUserId);
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, {
        classId,
        toUserId: viewerUserId,
        type: 'offer',
        data: offer,
      });
    };

    const onViewerRequest = ({ classId: roomId, userId }: { classId: string; userId: string }) => {
      if (roomId !== classId || !userId) {
        return;
      }

      void createOfferForViewer(userId).catch(() => {
        closePeer(userId);
      });
    };

    const onSignal = async (payload: DevStreamSignalPayload) => {
      if (payload.classId !== classId) {
        return;
      }

      const peer = peersRef.current.get(payload.fromUserId);
      if (!peer) {
        return;
      }

      try {
        if (payload.type === 'answer') {
          await peer.setRemoteDescription(payload.data as RTCSessionDescriptionInit);
        } else if (payload.type === 'ice') {
          await peer.addIceCandidate(payload.data as RTCIceCandidateInit);
        }
      } catch {
        closePeer(payload.fromUserId);
      }
    };

    socket.on(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, onViewerRequest);
    socket.on(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, onSignal);

    return () => {
      socket.off(LIVE_NS_EVENTS.DEV_STREAM_REQUEST, onViewerRequest);
      socket.off(LIVE_NS_EVENTS.DEV_STREAM_SIGNAL, onSignal);
      for (const viewerUserId of [...peersRef.current.keys()]) {
        closePeer(viewerUserId);
      }
    };
  }, [classId, enabled, mediaStream]);

  useEffect(() => {
    if (!enabled || !mediaStream || !classId) {
      return;
    }

    for (const peer of peersRef.current.values()) {
      syncPeerTracks(peer, mediaStream);
    }
  }, [classId, enabled, mediaStream]);
}

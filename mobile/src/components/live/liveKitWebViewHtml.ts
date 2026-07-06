/** Inline HTML player for LiveKit in Expo Go (WebView has WebRTC; native module does not). */
export function buildLiveKitWebViewHtml(url: string, token: string): string {
  const config = JSON.stringify({ url, token });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; height: 100%; background: #0b1020; overflow: hidden; }
    video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: #0b1020; }
    #status {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #94a3b8; font: 14px -apple-system, system-ui, sans-serif; text-align: center; padding: 24px;
    }
  </style>
</head>
<body>
  <video id="video" autoplay playsinline></video>
  <div id="status">Joining live class…</div>
  <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.20.0/dist/livekit-client.umd.min.js"></script>
  <script>
    (async function () {
      const status = document.getElementById('status');
      const video = document.getElementById('video');
      const cfg = ${config};
      const post = (msg) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(msg);

      try {
        const { Room, RoomEvent, Track } = LivekitClient;
        const room = new Room({ adaptiveStream: true, dynacast: true });

        const attachTracks = () => {
          for (const participant of room.remoteParticipants.values()) {
            for (const publication of participant.trackPublications.values()) {
              if (!publication.isSubscribed) publication.setSubscribed(true);
              const track = publication.track;
              if (!track) continue;
              if (publication.kind === Track.Kind.Video) {
                track.attach(video);
                status.style.display = 'none';
                post('video');
              } else if (publication.kind === Track.Kind.Audio) {
                track.attach();
              }
            }
          }
        };

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video) {
            track.attach(video);
            status.style.display = 'none';
            post('video');
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });
        room.on(RoomEvent.TrackPublished, attachTracks);
        room.on(RoomEvent.ParticipantConnected, attachTracks);
        room.on(RoomEvent.Reconnected, attachTracks);

        await room.connect(cfg.url, cfg.token);
        attachTracks();
        if (!video.srcObject && video.readyState < 2) {
          post('connected');
        }
      } catch (err) {
        const message = err && err.message ? err.message : 'Failed to join live stream';
        status.textContent = message;
        post('error:' + message);
      }
    })();
  </script>
</body>
</html>`;
}

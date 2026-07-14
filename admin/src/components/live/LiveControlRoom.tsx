import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminLiveClass } from '../../api/liveClasses';
import { useHostLiveRoom, type HostRoomCredentials } from '../../hooks/useHostLiveRoom';
import { useDevStreamRelay } from '../../hooks/useDevStreamRelay';
import { useLiveClassChat } from '../../hooks/useLiveClassChat';
import './live-room.css';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarTone(name: string): 'gold' | 'navy' | 'sage' {
  const code = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  if (code % 3 === 0) return 'gold';
  if (code % 3 === 1) return 'navy';
  return 'sage';
}

function formatElapsed(startedAt?: string | null) {
  if (!startedAt) {
    return '00:00';
  }

  const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(elapsedSec / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsedSec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.includes('?') ||
    /^q\d+/i.test(trimmed) ||
    /^(what|how|why|when|where|can|could|please|repeat|explain|doubt)/i.test(trimmed)
  );
}

type LiveControlRoomProps = {
  liveClass: AdminLiveClass;
  credentials: HostRoomCredentials;
  onEnded: () => void;
  ending?: boolean;
  onEndClass: () => Promise<void>;
};

export function LiveControlRoom({
  liveClass,
  credentials,
  onEnded,
  ending,
  onEndClass,
}: LiveControlRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [timer, setTimer] = useState(() => formatElapsed(liveClass.startedAt));
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);

  const room = useHostLiveRoom(credentials);
  const chat = useLiveClassChat(liveClass.id, { isHost: true });
  useDevStreamRelay({
    classId: liveClass.id,
    mediaStream: room.devMode ? room.mediaStream : null,
    enabled: room.devMode && room.connected,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(formatElapsed(liveClass.startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [liveClass.startedAt]);

  useEffect(() => {
    const track = room.displayTrack;
    const stream = room.mediaStream;
    const element = videoRef.current;

    if (!element) {
      return;
    }

    if (stream) {
      element.srcObject = stream;
      return () => {
        element.srcObject = null;
      };
    }

    if (track) {
      track.attach(element);
      return () => {
        track.detach(element);
      };
    }

    element.srcObject = null;
    return undefined;
  }, [room.displayTrack, room.mediaStream]);

  useEffect(() => {
    const latest = chat.reactions.at(-1);
    if (!latest) {
      return;
    }

    const id = `${latest.createdAt}-${latest.userId}`;
    setFloatingReactions((current) => [...current, { id, emoji: latest.emoji }]);
    const timeout = window.setTimeout(() => {
      setFloatingReactions((current) => current.filter((item) => item.id !== id));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [chat.reactions]);

  const visibleParticipants = useMemo(() => chat.participants.slice(0, 8), [chat.participants]);
  const overflowCount = Math.max(0, chat.participants.length - visibleParticipants.length);
  const latestHand = [...chat.handNotifications].reverse().find((item) => item.raised);

  const hostIds = useMemo(
    () =>
      new Set(
        chat.messages
          .filter((message) => message.isHost)
          .map((message) => message.userId)
          .concat(chat.participants.filter((entry) => entry.isHost).map((entry) => entry.userId)),
      ),
    [chat.messages, chat.participants],
  );

  const hostMessages = useMemo(
    () => chat.messages.filter((message) => message.isHost || hostIds.has(message.userId)),
    [chat.messages, hostIds],
  );

  const studentMessages = useMemo(
    () =>
      chat.messages.filter(
        (message) =>
          message.userId !== 'hand-ack' &&
          !message.isHost &&
          !hostIds.has(message.userId),
      ),
    [chat.messages, hostIds],
  );

  const studentQuestions = useMemo(() => {
    return studentMessages
      .filter((message) => isLikelyQuestion(message.text))
      .slice(-12);
  }, [studentMessages]);

  const pinnedMessage = chat.pinnedAnnouncement;

  useEffect(() => {
    const body = chatBodyRef.current;
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
  }, [studentMessages.length]);

  useEffect(() => {
    const body = questionsRef.current;
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
  }, [studentQuestions.length]);

  const topicLabel = liveClass.topic
    ? `Now: ${liveClass.topic}`
    : liveClass.exam
      ? `${liveClass.exam} — ${liveClass.title}`
      : liveClass.title;

  async function handleEndClass() {
    await room.disconnect();
    await onEndClass();
    onEnded();
  }

  function handleSendMessage() {
    const text = chatInput.trim();
    if (!text) {
      return;
    }

    if (chat.sendMessage(text)) {
      setChatInput('');
    }
  }

  function handlePinMessage() {
    const text = pinInput.trim();
    if (!text) {
      return;
    }

    if (chat.sendAnnouncement(text)) {
      setPinInput('');
    }
  }

  function handleMuteAll() {
    chat.muteAllStudents();
    void room.muteAll();
  }

  return (
    <div className="live-room-grid">
      <div className="live-stage">
        {room.displayTrack || room.mediaStream ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          <div className="edu">
            <div className="fav">{initials(liveClass.instructor || liveClass.title)}</div>
            <div className="en">{liveClass.instructor || 'Educator'}</div>
            <div className="et">
              {liveClass.exam}
              {liveClass.topic ? ` · ${liveClass.topic}` : ''}
            </div>
          </div>
        )}

        <div className="live-floating-reactions" aria-hidden>
          {floatingReactions.map((item) => (
            <span key={item.id} className="live-float-emoji">
              {item.emoji}
            </span>
          ))}
        </div>

        <div className="live-topbar">
          <div className="live-badge">
            <span className="dot" />
            LIVE
          </div>
          {liveClass.autoRecord ? (
            <div className="live-rec">
              <span className="rd" />
              REC
            </div>
          ) : null}
          <div className="live-class-title">{liveClass.title}</div>
          <div className="live-viewers">
            <svg viewBox="0 0 24 24">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="num">{chat.presenceCount}</span>
          </div>
        </div>

        <div className="live-topic">{topicLabel}</div>
        <div className="live-timer">{timer}</div>

        {pinnedMessage ? (
          <div className="live-pinned">
            <div className="ic">
              <svg viewBox="0 0 24 24">
                <path d="M12 17v5M9 2h6l-1 7 4 3H6l4-3z" />
              </svg>
            </div>
            <div className="tx">
              <b>PINNED · {(liveClass.instructor || 'HOST').toUpperCase()}</b>
              <p>{pinnedMessage}</p>
            </div>
          </div>
        ) : null}

        {(room.connecting || room.error || chat.error) && (
          <div className="live-connecting">
            {room.error ??
              chat.error?.message ??
              (room.devMode
                ? 'Starting local preview (dev streaming — set LIVEKIT_API_SECRET for real video)'
                : 'Connecting to LiveKit…')}
          </div>
        )}

        <div className="live-controls">
          <button
            type="button"
            className={`live-ctrl ${room.micEnabled ? '' : 'off'}`}
            title="Toggle microphone"
            onClick={() => void room.toggleMic()}
          >
            <svg viewBox="0 0 24 24">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
          <button
            type="button"
            className={`live-ctrl ${room.cameraEnabled ? '' : 'off'}`}
            title="Toggle camera"
            onClick={() => void room.toggleCamera()}
          >
            <svg viewBox="0 0 24 24">
              <rect x="2" y="6" width="14" height="12" rx="3" />
              <path d="m22 8-6 4 6 4z" />
            </svg>
          </button>
          <button
            type="button"
            className={`live-ctrl ${room.screenEnabled ? 'off' : ''}`}
            title="Share screen"
            onClick={() => void room.toggleScreenShare()}
          >
            <svg viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </button>
          <button type="button" className="live-ctrl" title="Mute all students" onClick={handleMuteAll}>
            <svg viewBox="0 0 24 24">
              <path d="M16 4H8a4 4 0 0 0 0 8h8M9 20a4 4 0 0 0 4-4" />
            </svg>
          </button>
          <button
            type="button"
            className="live-ctrl end"
            title="End class"
            disabled={ending}
            onClick={() => void handleEndClass()}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="live-side">
        {latestHand ? (
          <div className="live-hand-toast">✋ {latestHand.userName} raised a hand</div>
        ) : null}

        <div className="live-parts">
          <div className="h">
            Participants <span className="c num">{chat.presenceCount}</span>
          </div>
          <div className="live-pav-row">
            {visibleParticipants.map((participant) => (
              <div
                key={participant.userId}
                className={`live-pav ${avatarTone(participant.name)}`}
                title={participant.name}
              >
                {initials(participant.name)}
              </div>
            ))}
            {overflowCount > 0 ? <div className="live-pav more">+{overflowCount}</div> : null}
          </div>
        </div>

        {chat.raisedHands.length > 0 ? (
          <div className="live-hands">
            <div className="h">Raised hands ({chat.raisedHands.length})</div>
            <div className="live-hand-list">
              {chat.raisedHands.map((hand) => (
                <div key={hand.userId} className="live-hand-item">
                  ✋ {hand.userName}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="live-pin">
          <div className="h">Pin to class</div>
          <div className="live-pin-row">
            <input
              placeholder="Formula, note, or instruction for all students…"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePinMessage();
                }
              }}
            />
            <button type="button" className="pri" onClick={handlePinMessage}>
              Pin
            </button>
          </div>
        </div>

        <div className="live-host-chat">
          <div className="h">
            Educator messages <span className="c num">{hostMessages.length}</span>
          </div>
          <div className="body host-body">
            {hostMessages.length === 0 ? (
              <div className="live-empty-inline">Your messages to the class appear here.</div>
            ) : (
              hostMessages.map((message) => (
                <div key={`host-${message.id}`} className="live-msg host">
                  <div className={`ma live-pav ${avatarTone(message.userName)}`}>
                    {initials(message.userName)}
                  </div>
                  <div className="mb">
                    <b>
                      {message.userName} <span className="host-tag">HOST</span>
                    </b>
                    <p>{message.text}</p>
                    <span className="at">{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="live-questions">
          <div className="h">
            Student questions <span className="c num">{studentQuestions.length}</span>
          </div>
          <div className="body" ref={questionsRef}>
            {studentQuestions.length === 0 ? (
              <div className="live-empty-inline">Questions from chat appear here in real time.</div>
            ) : (
              studentQuestions.map((message) => (
                <div key={`q-${message.id}`} className="live-q">
                  <div className={`ma live-pav ${avatarTone(message.userName)}`}>
                    {initials(message.userName)}
                  </div>
                  <div className="mb">
                    <b>{message.userName}</b>
                    <p>{message.text}</p>
                    <span className="at">{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="live-chat">
          <div className="h">
            All student messages <span className="c num">{studentMessages.length}</span>
            {!chat.connected
              ? chat.error
                ? ` · ${chat.error.message}`
                : ' · connecting…'
              : ''}
          </div>
          <div className="body" ref={chatBodyRef}>
            {studentMessages.length === 0 ? (
              <div className="live-empty-inline">Student chat messages appear here in real time.</div>
            ) : (
              studentMessages.map((message) => (
                <div key={message.id} className="live-msg">
                  <div className={`ma live-pav ${avatarTone(message.userName)}`}>
                    {initials(message.userName)}
                  </div>
                  <div className="mb">
                    <b>{message.userName}</b>
                    <p>{message.text}</p>
                    <span className="at">{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="react">
            {['👍', '🔥', '👏', '❤️'].map((emoji) => (
              <button key={emoji} type="button" onClick={() => chat.sendReaction(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
          <div className="foot">
            <input
              placeholder="Message students…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button type="button" onClick={handleSendMessage}>
              <svg viewBox="0 0 24 24">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

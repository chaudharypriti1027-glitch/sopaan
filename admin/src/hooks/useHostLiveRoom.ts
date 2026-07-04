import { isDevStreamingUrl } from '../realtime/socketOrigin';
import { useDevHostRoom } from './useDevHostRoom';
import { useLivekitHostRoom } from './useLivekitHostRoom';

export type HostRoomCredentials = {
  url: string;
  token: string;
};

export type { RoomParticipant } from './useLivekitHostRoom';

export function useHostLiveRoom(credentials: HostRoomCredentials | null) {
  const devMode = isDevStreamingUrl(credentials?.url);
  const devRoom = useDevHostRoom(devMode ? credentials : null);
  const livekitRoom = useLivekitHostRoom(devMode ? null : credentials);
  return devMode ? devRoom : livekitRoom;
}

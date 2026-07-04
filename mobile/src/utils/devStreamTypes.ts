export type DevStreamSignalType = 'offer' | 'answer' | 'ice';

export type DevStreamSignalPayload = {
  classId: string;
  fromUserId: string;
  type: DevStreamSignalType;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

export type DevStreamRequestPayload = {
  classId: string;
  userId: string;
  userName?: string;
};

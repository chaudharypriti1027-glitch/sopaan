let ioInstance = null;

export function setRealtimeIo(io) {
  ioInstance = io;
}

export function getRealtimeIo() {
  return ioInstance;
}

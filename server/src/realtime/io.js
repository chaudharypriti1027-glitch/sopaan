let ioInstance = null;
let liveNamespace = null;
let adminNamespace = null;

export function setRealtimeIo(io) {
  ioInstance = io;
}

export function getRealtimeIo() {
  return ioInstance;
}

export function setLiveNamespace(ns) {
  liveNamespace = ns;
}

export function getLiveNamespace() {
  return liveNamespace;
}

export function setAdminNamespace(ns) {
  adminNamespace = ns;
}

export function getAdminNamespace() {
  return adminNamespace;
}

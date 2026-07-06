import { getAdminNamespace } from './io.js';
import { ADMIN_NS_EVENTS, ADMIN_STAFF_ROOM } from './adminEvents.js';

export function broadcastBookGenProgress(payload) {
  const adminNs = getAdminNamespace();
  if (!adminNs) {
    return;
  }

  adminNs.to(ADMIN_STAFF_ROOM).emit(ADMIN_NS_EVENTS.BOOK_GEN_PROGRESS, payload);
}

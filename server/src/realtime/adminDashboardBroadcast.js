import { getAdminNamespace } from './io.js';
import { ADMIN_NS_EVENTS, ADMIN_STAFF_ROOM } from './adminEvents.js';
import { getAdminDashboardCounters } from '../services/admin/adminDashboardCounters.js';

let pending = null;

export function scheduleAdminDashboardBroadcast() {
  if (pending) {
    return pending;
  }

  pending = new Promise((resolve) => {
    setTimeout(async () => {
      pending = null;
      try {
        await broadcastAdminDashboardCounters();
      } catch {
        /* non-fatal */
      }
      resolve();
    }, 250);
  });

  return pending;
}

export async function broadcastAdminDashboardCounters() {
  const adminNs = getAdminNamespace();
  if (!adminNs) {
    return null;
  }

  const counters = await getAdminDashboardCounters();
  adminNs.to(ADMIN_STAFF_ROOM).emit(ADMIN_NS_EVENTS.COUNTERS, counters);
  return counters;
}

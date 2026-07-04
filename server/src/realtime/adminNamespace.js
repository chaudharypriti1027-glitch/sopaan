import { normalizeUserRole } from '../constants/userRoles.js';
import { getAdminDashboardCounters } from '../services/admin/adminDashboardCounters.js';
import { ADMIN_NS_EVENTS, ADMIN_STAFF_ROOM } from './adminEvents.js';

const STAFF_ROLES = new Set(['admin', 'creator', 'moderator']);

export function registerAdminNamespace(adminNs) {
  adminNs.on('connection', async (socket) => {
    const role = normalizeUserRole(socket.user?.role);

    if (!STAFF_ROLES.has(role)) {
      socket.emit(ADMIN_NS_EVENTS.ERROR, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
      socket.disconnect(true);
      return;
    }

    socket.join(ADMIN_STAFF_ROOM);

    try {
      const counters = await getAdminDashboardCounters();
      socket.emit(ADMIN_NS_EVENTS.COUNTERS, counters);
    } catch {
      socket.emit(ADMIN_NS_EVENTS.ERROR, {
        code: 'COUNTERS_UNAVAILABLE',
        message: 'Could not load dashboard counters',
      });
    }

    socket.on('disconnect', () => {
      socket.leave(ADMIN_STAFF_ROOM);
    });
  });
}

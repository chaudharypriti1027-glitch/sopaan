import { requireRole } from './requireRole.js';

/** Staff roles allowed to access the admin console API. */
export const staffOnly = requireRole('admin', 'creator', 'moderator');

/** Admin-only routes (revenue, settings, team, coupons, jobs, etc.). */
export const adminOnly = requireRole('admin');

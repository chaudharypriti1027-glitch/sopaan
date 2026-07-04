import type { UserRole } from '../api/types';

export const STAFF_ROLES: UserRole[] = ['admin', 'creator', 'moderator'];

export function isStaffRole(role?: string | null): role is UserRole {
  return STAFF_ROLES.includes(role as UserRole);
}

export function isAdminRole(role?: string | null) {
  return role === 'admin';
}

export const ADMIN_ONLY_NAV_IDS = new Set([
  'coupons',
  'revenue',
  'aifeedback',
  'jobs',
  'roles',
  'settings',
]);

export const ADMIN_ONLY_PATHS = new Set([
  '/coupons',
  '/revenue',
  '/ai-feedback',
  '/jobs',
  '/roles',
  '/settings',
]);

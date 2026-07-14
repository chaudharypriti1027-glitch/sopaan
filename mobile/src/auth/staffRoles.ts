/** Staff roles that must use the web admin console, not the student app. */
export const STAFF_ROLES = ['admin', 'creator', 'moderator'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role?: string | null): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

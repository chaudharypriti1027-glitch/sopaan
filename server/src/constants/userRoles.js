/** Canonical user roles — JWT `role` claim and User.role must use these values. */
export const USER_ROLES = ['user', 'student', 'creator', 'moderator', 'admin'];

/** @deprecated Legacy alias — normalized to `creator` on save. */
export const LEGACY_MENTOR_ROLE = 'mentor';

export function normalizeUserRole(role) {
  if (role === LEGACY_MENTOR_ROLE) {
    return 'creator';
  }
  if (USER_ROLES.includes(role)) {
    return role;
  }
  return 'student';
}

export function isAdminRole(role) {
  return normalizeUserRole(role) === 'admin';
}

import { isStaffRole, STAFF_ROLES } from '../staffRoles';

describe('staffRoles', () => {
  it('lists all staff roles', () => {
    expect(STAFF_ROLES).toEqual(['admin', 'creator', 'moderator']);
  });

  it('detects staff roles', () => {
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('creator')).toBe(true);
    expect(isStaffRole('moderator')).toBe(true);
    expect(isStaffRole('student')).toBe(false);
  });
});

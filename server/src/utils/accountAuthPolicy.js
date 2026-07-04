import { AppError } from '../utils/AppError.js';

export function assertAccountCanAuthenticate(user) {
  if (!user) {
    return;
  }

  if (user.accountStatus === 'deleted') {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }
}

export function isAccountSuspended(user) {
  return user?.accountStatus === 'suspended';
}

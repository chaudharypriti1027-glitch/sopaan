import { AppError } from './AppError.js';

/**
 * Normalize Indian mobile numbers to E.164 +91XXXXXXXXXX.
 * Accepts 10-digit, 0-prefixed, 91-prefixed, or +91-prefixed input.
 * @param {string} input
 * @returns {string}
 */
export function normalizeIndianPhone(input) {
  if (!input || typeof input !== 'string') {
    throw new AppError('Invalid phone number', 400, 'VALIDATION_ERROR');
  }

  const digits = input.replace(/\D/g, '');

  let national;

  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else {
    throw new AppError('Invalid phone number', 400, 'VALIDATION_ERROR');
  }

  if (!/^[6-9]\d{9}$/.test(national)) {
    throw new AppError('Invalid phone number', 400, 'VALIDATION_ERROR');
  }

  return `+91${national}`;
}

/**
 * @param {string} input
 * @returns {boolean}
 */
export function isValidIndianPhone(input) {
  try {
    normalizeIndianPhone(input);
    return true;
  } catch {
    return false;
  }
}

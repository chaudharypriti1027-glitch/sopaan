import bcrypt from 'bcrypt';
import { OtpToken } from '../models/OtpToken.js';
import { AppError } from '../utils/AppError.js';
import { sendOtpSms } from './sms/index.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_BCRYPT_ROUNDS = 10;

const INVALID_OTP_MESSAGE = 'Invalid or expired OTP';

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Create/replace OTP for phone, send via SMS, return plaintext code (dev logging only).
 * @param {string} phone Normalized +91…
 */
export async function createAndSendOtp(phone) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpToken.deleteMany({ phone });
  await OtpToken.create({ phone, codeHash, expiresAt, attempts: 0 });

  await sendOtpSms(phone, code);

  return code;
}

/**
 * Verify OTP for phone. Increments attempts on failure; deletes token on success.
 * @param {string} phone Normalized +91…
 * @param {string} code 6-digit code
 * @returns {Promise<boolean>}
 */
export async function verifyAndConsumeOtp(phone, code) {
  const token = await OtpToken.findOne({ phone }).select('+codeHash');

  if (!token || token.expiresAt <= new Date()) {
    if (token) {
      await OtpToken.deleteOne({ _id: token._id });
    }

    throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining: 0 });
  }

  if (token.attempts >= MAX_OTP_ATTEMPTS) {
    await OtpToken.deleteOne({ _id: token._id });
    throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining: 0 });
  }

  const matches = await bcrypt.compare(code, token.codeHash);

  if (!matches) {
    token.attempts += 1;
    await token.save();
    const attemptsRemaining = Math.max(0, MAX_OTP_ATTEMPTS - token.attempts);
    throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining });
  }

  await OtpToken.deleteOne({ _id: token._id });
  return true;
}

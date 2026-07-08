import bcrypt from 'bcrypt';
import { OtpToken } from '../models/OtpToken.js';
import { AppError } from '../utils/AppError.js';
import { sendOtpSms } from './sms/index.js';
import {
  checkTwilioPhoneVerification,
  isTwilioVerifyEnabled,
  startTwilioPhoneVerification,
} from './sms/twilioVerify.js';
import { sendOtpEmail } from './email/sendOtpEmail.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_BCRYPT_ROUNDS = 10;

const INVALID_OTP_MESSAGE = 'Invalid or expired OTP';

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function persistOtp({ phone, email, code }) {
  const codeHash = await bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const filter = phone ? { phone } : { email };

  await OtpToken.deleteMany(filter);
  await OtpToken.create({ phone, email, codeHash, expiresAt, attempts: 0 });
}

/**
 * Create/replace OTP for phone, send via SMS, return plaintext code (dev logging only).
 * @param {string} phone Normalized +91…
 */
export async function createAndSendOtp(phone) {
  if (isTwilioVerifyEnabled()) {
    await startTwilioPhoneVerification(phone);
    return null;
  }

  const code = generateOtpCode();
  await persistOtp({ phone, code });
  await sendOtpSms(phone, code);
  return code;
}

/**
 * Create/replace OTP for email, send via SMTP.
 * @param {string} email Normalized lowercase email
 */
export async function createAndSendEmailOtp(email) {
  const code = generateOtpCode();
  await persistOtp({ email, code });
  await sendOtpEmail(email, code);
  return code;
}

async function verifyOtpToken(filter, code) {
  const token = await OtpToken.findOne(filter).select('+codeHash');

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

/**
 * Verify OTP for phone. Increments attempts on failure; deletes token on success.
 * @param {string} phone Normalized +91…
 * @param {string} code 6-digit code
 */
export async function verifyAndConsumeOtp(phone, code) {
  if (isTwilioVerifyEnabled()) {
    return checkTwilioPhoneVerification(phone, code);
  }

  return verifyOtpToken({ phone }, code);
}

/**
 * Verify OTP for email.
 * @param {string} email Normalized lowercase email
 * @param {string} code 6-digit code
 */
export async function verifyAndConsumeEmailOtp(email, code) {
  return verifyOtpToken({ email }, code);
}

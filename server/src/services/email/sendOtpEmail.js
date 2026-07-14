import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';
import { buildOtpEmailHtml, buildOtpEmailSubject, buildOtpEmailText } from './otpEmailCopy.js';

export function isEmailOtpConfigured() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(host && user && pass);
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
  };
}

/**
 * Send a 6-digit login OTP to the user's email inbox.
 * Falls back to console logging when SMTP is not configured (local dev).
 */
export async function sendOtpEmail(to, code) {
  const normalizedTo = to?.trim().toLowerCase();
  if (!normalizedTo) {
    throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  }

  const config = smtpConfig();
  const from =
    process.env.OTP_EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'Sopaan <noreply@sopaan.app>';

  const subject = buildOtpEmailSubject();
  const text = buildOtpEmailText(code);
  const html = buildOtpEmailHtml(code);

  if (!config || env.isTest) {
    if (env.isProduction && !config) {
      throw new AppError('Email OTP is not configured', 503, 'EMAIL_UNAVAILABLE');
    }
    logger.info('[email][dev] OTP', { to: normalizedTo, code });
    return;
  }

  const transport = nodemailer.createTransport(config);

  try {
    await transport.sendMail({
      from,
      to: normalizedTo,
      subject,
      text,
      html,
    });
    logger.info('[email][smtp] OTP sent', { to: normalizedTo });
  } catch (err) {
    logger.error('[email][smtp] OTP send failed', { to: normalizedTo, message: err.message });
    throw new AppError('Failed to send OTP email', 503, 'EMAIL_UNAVAILABLE');
  }
}

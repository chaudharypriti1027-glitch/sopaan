import { env } from '../../config/env.js';
import { logger } from '../../observability/logger.js';

function resolveAdminConsoleBaseUrl() {
  const configured = process.env.ADMIN_CONSOLE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const clientBase = env.clientUrl?.replace(/\/$/, '') ?? 'http://localhost:4000';
  return `${clientBase}/admin`;
}

export function buildTeamInviteSignupUrl(token) {
  const base = resolveAdminConsoleBaseUrl();
  return `${base}/invite?token=${encodeURIComponent(token)}`;
}

export async function sendTeamInviteEmail({ to, role, signupUrl, invitedByName }) {
  const subject = 'You are invited to Sopaan Admin';
  const text = [
    `Hi,`,
    ``,
    `${invitedByName ?? 'An admin'} invited you to join the Sopaan admin console as ${role}.`,
    ``,
    `Create your account using this link (expires in 7 days):`,
    signupUrl,
    ``,
    `If you did not expect this invite, you can ignore this email.`,
  ].join('\n');

  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const from = process.env.TEAM_INVITE_EMAIL_FROM?.trim() || 'Sopaan <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('team invite email failed', { status: response.status, body });
      throw new Error('Failed to send invite email');
    }

    return { sent: true, signupUrl };
  }

  logger.info('[team-invite] email (dev)', { to, role, signupUrl });
  return { sent: false, signupUrl };
}

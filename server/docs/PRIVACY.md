# Privacy & data protection (DPDP-aware)

This document describes Sopaan's privacy mechanisms. **It is not legal advice** — consult qualified counsel for DPDP Act compliance sign-off.

## Overview

Sopaan implements user-facing controls aligned with India's Digital Personal Data Protection Act, 2023 (DPDP):

- Privacy policy + explicit consent at signup (including AI processing)
- Right to access: JSON data export
- Right to erasure: account deletion with confirmation
- PII minimization in AI prompts
- Documented data inventory, purposes, retention, and third-party processors

Configuration lives in `server/src/config/privacyConfig.js` and is overridable via environment variables.

## Data we collect

| Category | Examples | Purpose | Retention (default) |
|----------|----------|---------|---------------------|
| Account | Name, email or phone, password hash | Authentication, support | Until deletion + anonymized stub |
| Study profile | Exam goal, category, state, education | Personalised plans | Until deletion |
| Activity | Attempts, planner, focus logs, badges | Progress tracking | Until deletion |
| Device | Expo push token | Notifications (opt-in) | Until deletion |
| Payments | Order id, plan, amount (via Razorpay) | Subscriptions | Legal/tax retention may apply |
| AI usage | Feature, token counts | Quota, cost monitoring | 90 days (`RETENTION_AI_CALL_LOGS_DAYS`) |
| Notifications | In-app alerts | User engagement | 365 days (`RETENTION_NOTIFICATIONS_DAYS`) |
| Errors | Request id, user id (Sentry) | Reliability | Per Sentry policy |

Full inventory: `GET /api/privacy/inventory`

## Third-party processors

| Processor | Purpose | Data sent |
|-----------|---------|-----------|
| **Anthropic (Claude)** | AI tutoring, generation, evaluation | Study content & stats — **not** name, email, or phone |
| **Razorpay** | Payments | Checkout PII handled by Razorpay |
| **Expo / Apple / Google** | Push notifications | Device token, notification body |
| **Sentry** | Error monitoring | User id, request metadata (PII redacted in logs) |

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/privacy/policy` | No | Privacy policy JSON |
| GET | `/api/privacy/inventory` | No | Data inventory + retention |
| GET | `/api/privacy/consent` | Yes | Current consent state |
| PATCH | `/api/privacy/consent` | Yes | Update marketing opt-in/out |
| GET | `/api/privacy/export` | Yes | Download all user data (JSON) |
| POST | `/api/privacy/deletion/request` | Yes | Start deletion (password or OTP) |
| POST | `/api/privacy/deletion/confirm` | Yes | Confirm with token + phrase |

### Signup consent

Signup and new OTP accounts require:

```json
{
  "privacyConsent": {
    "policyVersion": "2025-06-01",
    "aiProcessing": true,
    "marketing": false
  }
}
```

`aiProcessing: true` is required — AI features cannot operate without it.

### Account deletion flow

1. **Request** — `POST /api/privacy/deletion/request` with `{ "password": "..." }` or `{ "otpCode": "123456" }` (phone-only users).
2. Server returns a short-lived `deletionToken` and required `confirmPhrase` (`DELETE MY ACCOUNT` by default).
3. **Confirm** — `POST /api/privacy/deletion/confirm` with `{ deletionToken, confirmPhrase, refreshToken? }`.
4. User data is deleted/anonymized; sessions revoked.

Payment orders may be retained in anonymized form for legal obligations.

## AI PII minimization

`server/src/services/ai/piiMinimizer.js` strips email/phone patterns from outbound Claude prompts in `claudeClient.complete()`. Keys matching `email`, `phone`, `name`, `contact`, or `address` are dropped from structured payloads.

**We do not send** user name, email, or phone to Claude. `userId` is used server-side only for quotas and logging.

## Environment variables

```bash
PRIVACY_POLICY_VERSION=2025-06-01
PRIVACY_POLICY_URL=https://sopaan.app/privacy
TERMS_URL=https://sopaan.app/terms
PRIVACY_SUPPORT_EMAIL=privacy@sopaan.app
PRIVACY_DELETION_TOKEN_MIN=15
RETENTION_AI_CALL_LOGS_DAYS=90
RETENTION_NOTIFICATIONS_DAYS=365
RETENTION_DEFERRED_REFERRAL_DAYS=30
RETENTION_ANONYMIZED_USER_DAYS=2555
```

## Mobile

- Signup / OTP: consent checkboxes before account creation
- Settings → Privacy: policy, data export, marketing toggle, delete account

## Grievance

Users may contact **privacy@sopaan.app** for data protection grievances.

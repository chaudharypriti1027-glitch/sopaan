export const REFERRAL_REWARDS = Object.freeze({
  referrerCoins: Number(process.env.REFERRAL_REFERRER_COINS ?? 100),
  refereeCoins: Number(process.env.REFERRAL_REFEREE_COINS ?? 50),
  referrerTrialDays: Number(process.env.REFERRAL_REFERRER_TRIAL_DAYS ?? 0),
  refereeTrialDays: Number(process.env.REFERRAL_REFEREE_TRIAL_DAYS ?? 3),
});

export const REFERRAL_GUARDS = Object.freeze({
  minReferrerAgeHours: Number(process.env.REFERRAL_MIN_REFERRER_AGE_HOURS ?? 24),
  dailyReferralCap: Number(process.env.REFERRAL_DAILY_CAP ?? 20),
  deferredTtlDays: Number(process.env.REFERRAL_DEFERRED_TTL_DAYS ?? 30),
  signupWindowHours: Number(process.env.REFERRAL_SIGNUP_WINDOW_HOURS ?? 48),
});

export const REFERRAL_LINK_BASE =
  process.env.REFERRAL_LINK_BASE?.trim() || 'https://sopaan.app/refer';

export const REFERRAL_APP_SCHEME = 'sopaan';

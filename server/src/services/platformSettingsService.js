import { env } from '../config/env.js';
import { PlatformSettings } from '../models/PlatformSettings.js';

const SETTINGS_KEY = 'default';

let cachedSettings = null;
let loadPromise = null;

function rupeesFromEnvPaise(name, fallbackPaise) {
  return Math.round(Number(process.env[name] ?? fallbackPaise) / 100);
}

export function buildDefaultPlatformSettings() {
  return {
    key: SETTINGS_KEY,
    freeAiQuota: Number(process.env.FREE_AI_DOUBTS_PER_DAY ?? 10),
    freeAiTestsPerDay: Number(process.env.FREE_AI_TESTS_PER_DAY ?? 2),
    freeAiQualityDoubtsPerDay: Number(process.env.FREE_AI_QUALITY_DOUBTS_PER_DAY ?? 2),
    freeAiEvaluationsPerDay: Number(process.env.FREE_AI_EVALUATIONS_PER_DAY ?? 0),
    freeMocksPerDay: Number(process.env.FREE_MOCKS_PER_DAY ?? 3),
    freeShowAds: process.env.FREE_SHOW_ADS !== 'false',
    freeDetailedAnalytics: process.env.FREE_DETAILED_ANALYTICS === 'true',
    proPriceMonthly: rupeesFromEnvPaise('PREMIUM_MONTHLY_AMOUNT_PAISE', 29900),
    proPriceYearly: rupeesFromEnvPaise('PREMIUM_YEARLY_AMOUNT_PAISE', 249900),
    proAiTestsPerDay: Number(process.env.PRO_AI_TESTS_PER_DAY ?? 999),
    proAiDoubtsPerDay: Number(process.env.PRO_AI_DOUBTS_PER_DAY ?? 200),
    proAiQualityDoubtsPerDay: Number(process.env.PRO_AI_QUALITY_DOUBTS_PER_DAY ?? 50),
    proAiEvaluationsPerDay: Number(process.env.PRO_AI_EVALUATIONS_PER_DAY ?? 999),
    proMocksPerDay: Number(process.env.PRO_MOCKS_PER_DAY ?? 999),
  };
}

function serializeSettings(doc) {
  const source = doc?.toObject ? doc.toObject() : doc;
  return {
    freeAiQuota: source.freeAiQuota,
    freeAiTestsPerDay: source.freeAiTestsPerDay,
    freeAiQualityDoubtsPerDay: source.freeAiQualityDoubtsPerDay,
    freeAiEvaluationsPerDay: source.freeAiEvaluationsPerDay,
    freeMocksPerDay: source.freeMocksPerDay,
    freeShowAds: source.freeShowAds,
    freeDetailedAnalytics: source.freeDetailedAnalytics,
    proPriceMonthly: source.proPriceMonthly,
    proPriceYearly: source.proPriceYearly,
    proAiTestsPerDay: source.proAiTestsPerDay,
    proAiDoubtsPerDay: source.proAiDoubtsPerDay,
    proAiQualityDoubtsPerDay: source.proAiQualityDoubtsPerDay,
    proAiEvaluationsPerDay: source.proAiEvaluationsPerDay,
    proMocksPerDay: source.proMocksPerDay,
    updatedAt: source.updatedAt ?? null,
  };
}

export function getSettingsSnapshot() {
  return cachedSettings ?? serializeSettings(buildDefaultPlatformSettings());
}

function maskSecret(value, visible = 4) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= visible) {
    return '***';
  }

  return `${trimmed.slice(0, visible)}${'*'.repeat(8)}`;
}

export function getMaskedIntegrations() {
  return {
    anthropic: {
      configured: Boolean(env.anthropicApiKey),
      masked: maskSecret(env.anthropicApiKey),
      model: env.anthropicModel,
      fastModel: env.anthropicFastModel,
      editable: false,
      source: 'env',
    },
    razorpay: {
      configured: Boolean(env.razorpayKeyId && env.razorpayKeySecret),
      keyIdMasked: maskSecret(env.razorpayKeyId, 8),
      webhookConfigured: Boolean(env.razorpayWebhookSecret),
      editable: false,
      source: 'env',
    },
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY?.trim()),
      masked: maskSecret(process.env.RESEND_API_KEY),
      editable: false,
      source: 'env',
    },
    redis: {
      configured: Boolean(env.redisUrl),
      masked: maskSecret(env.redisUrl, 8),
      editable: false,
      source: 'env',
    },
    livekit: {
      configured: Boolean(env.livekitApiKey && env.livekitApiSecret),
      keyMasked: maskSecret(env.livekitApiKey),
      editable: false,
      source: 'env',
    },
    expoPush: {
      configured: Boolean(env.expoAccessToken),
      masked: maskSecret(env.expoAccessToken),
      editable: false,
      source: 'env',
    },
    newsApiAi: {
      configured: Boolean(env.newsApiAiKey),
      masked: maskSecret(env.newsApiAiKey),
      editable: false,
      source: 'env',
    },
    voyageEmbeddings: {
      configured: Boolean(env.voyageApiKey),
      masked: maskSecret(env.voyageApiKey),
      editable: false,
      source: 'env',
    },
    googleAuth: {
      configured: env.googleClientIds.length > 0,
      clientIdsCount: env.googleClientIds.length,
      editable: false,
      source: 'env',
    },
    objectStorage: {
      configured: Boolean(env.s3Bucket && env.s3AccessKey && env.s3SecretKey),
      bucket: env.s3Bucket || null,
      editable: false,
      source: 'env',
    },
  };
}

export async function ensurePlatformSettings() {
  if (cachedSettings) {
    return cachedSettings;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      let doc = await PlatformSettings.findOne({ key: SETTINGS_KEY });
      if (!doc) {
        doc = await PlatformSettings.create(buildDefaultPlatformSettings());
      }
      cachedSettings = serializeSettings(doc);
      return cachedSettings;
    })();
  }

  return loadPromise;
}

export async function getAdminPlatformSettings() {
  const settings = await ensurePlatformSettings();
  return {
    settings,
    integrations: getMaskedIntegrations(),
    updatedAt: settings.updatedAt,
  };
}

const EDITABLE_FIELDS = [
  'freeAiQuota',
  'freeAiTestsPerDay',
  'freeAiQualityDoubtsPerDay',
  'freeAiEvaluationsPerDay',
  'freeMocksPerDay',
  'freeShowAds',
  'freeDetailedAnalytics',
  'proPriceMonthly',
  'proPriceYearly',
  'proAiTestsPerDay',
  'proAiDoubtsPerDay',
  'proAiQualityDoubtsPerDay',
  'proAiEvaluationsPerDay',
  'proMocksPerDay',
];

export async function updatePlatformSettings(updates) {
  const patch = {};
  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) {
      patch[field] = updates[field];
    }
  }

  await ensurePlatformSettings();

  const doc = await PlatformSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: patch },
    { new: true, runValidators: true },
  );

  cachedSettings = serializeSettings(doc);
  loadPromise = Promise.resolve(cachedSettings);
  return getAdminPlatformSettings();
}

export function resetPlatformSettingsCache() {
  cachedSettings = null;
  loadPromise = null;
}

export function getFreeTierLimitsFromSettings(settings = getSettingsSnapshot()) {
  return {
    aiGenerateTestsPerDay: settings.freeAiTestsPerDay,
    aiDoubtsFastPerDay: settings.freeAiQuota,
    aiDoubtsQualityPerDay: settings.freeAiQualityDoubtsPerDay,
    aiEvaluationsPerDay: settings.freeAiEvaluationsPerDay,
    mocksPerDay: settings.freeMocksPerDay,
    showAds: settings.freeShowAds,
    detailedAnalytics: settings.freeDetailedAnalytics,
  };
}

export function getProTierLimitsFromSettings(settings = getSettingsSnapshot()) {
  return {
    aiGenerateTestsPerDay: settings.proAiTestsPerDay,
    aiDoubtsFastPerDay: settings.proAiDoubtsPerDay,
    aiDoubtsQualityPerDay: settings.proAiQualityDoubtsPerDay,
    aiEvaluationsPerDay: settings.proAiEvaluationsPerDay,
    mocksPerDay: settings.proMocksPerDay,
    showAds: false,
    detailedAnalytics: true,
  };
}

function formatInrFromRupees(rupees) {
  return `₹${Number(rupees).toLocaleString('en-IN')}`;
}

export function buildPremiumPlansFromSettings(settings = getSettingsSnapshot()) {
  const monthlyPaise = settings.proPriceMonthly * 100;
  const yearlyPaise = settings.proPriceYearly * 100;

  return {
    monthly: {
      id: 'monthly',
      label: 'Monthly',
      amountPaise: monthlyPaise,
      interval: 'month',
      displayAmount: formatInrFromRupees(settings.proPriceMonthly),
      description: 'Billed every month',
    },
    yearly: {
      id: 'yearly',
      label: 'Yearly',
      amountPaise: yearlyPaise,
      interval: 'year',
      displayAmount: formatInrFromRupees(settings.proPriceYearly),
      description: 'Save vs monthly billing',
    },
  };
}

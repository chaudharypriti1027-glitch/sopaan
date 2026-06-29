import { z } from 'zod';

const NODE_ENVS = ['development', 'production', 'test'];
const DEPLOY_ENVS = ['development', 'staging', 'production', 'e2e'];

const nonEmpty = z.string().trim().min(1);

function isTruthyFlag(value) {
  return value === 'true';
}

function formatIssues(issues) {
  return issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
}

/**
 * Validate process.env at boot. Production fails fast on missing integrations;
 * development/test allow DEV_STUB_AI and optional Redis/LiveKit/push.
 */
export function validateEnvironment(raw = process.env) {
  const nodeEnv = raw.NODE_ENV?.trim() || 'development';

  if (!NODE_ENVS.includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: "${raw.NODE_ENV}". Must be one of: ${NODE_ENVS.join(', ')}.`,
    );
  }

  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  if (isProduction && isTruthyFlag(raw.DEV_STUB_AI)) {
    throw new Error('DEV_STUB_AI cannot be enabled when NODE_ENV=production');
  }

  const deployEnv =
    raw.DEPLOY_ENV?.trim() || (isProduction ? 'production' : 'development');

  if (!DEPLOY_ENVS.includes(deployEnv)) {
    throw new Error(
      `Invalid DEPLOY_ENV: "${deployEnv}". Must be one of: ${DEPLOY_ENVS.join(', ')}.`,
    );
  }

  if (
    isProduction &&
    deployEnv === 'production' &&
    (isTruthyFlag(raw.E2E_STUB_AI) || isTruthyFlag(raw.E2E_MODE))
  ) {
    throw new Error('E2E_STUB_AI / E2E_MODE cannot be enabled when DEPLOY_ENV=production');
  }

  const stubAiMode =
    !isProduction &&
    (isTruthyFlag(raw.DEV_STUB_AI) ||
      isTruthyFlag(raw.E2E_STUB_AI) ||
      isTruthyFlag(raw.E2E_MODE));

  const baseSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535),
    MONGODB_URI: nonEmpty,
    JWT_SECRET: nonEmpty,
    JWT_REFRESH_SECRET: nonEmpty,
    CLIENT_URL: nonEmpty,
    ANTHROPIC_API_KEY: z.string().trim().optional(),
    RAZORPAY_KEY_ID: z.string().trim().optional(),
    RAZORPAY_KEY_SECRET: z.string().trim().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().trim().optional(),
    NEWSAPI_AI_KEY: z.string().trim().optional(),
    SENTRY_DSN: z.string().trim().optional(),
    GOOGLE_CLIENT_ID: z.string().trim().optional(),
    GOOGLE_CLIENT_IDS: z.string().trim().optional(),
    REDIS_URL: z.string().trim().optional(),
    EXPO_ACCESS_TOKEN: z.string().trim().optional(),
    LIVEKIT_API_KEY: z.string().trim().optional(),
    LIVEKIT_API_SECRET: z.string().trim().optional(),
    LIVEKIT_URL: z.string().trim().optional(),
  });

  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      ['Invalid environment configuration:', formatIssues(parsed.error.issues), '', 'Copy server/.env.example to server/.env and set all values.'].join(
        '\n',
      ),
    );
  }

  const data = parsed.data;
  const missing = [];

  if (!stubAiMode && !isTest && !isProduction && !data.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY (or set DEV_STUB_AI=true for local development)');
  }

  if (isProduction) {
    const productionRequired = [
      ['ANTHROPIC_API_KEY', data.ANTHROPIC_API_KEY],
      ['RAZORPAY_KEY_ID', data.RAZORPAY_KEY_ID],
      ['RAZORPAY_KEY_SECRET', data.RAZORPAY_KEY_SECRET],
      ['RAZORPAY_WEBHOOK_SECRET', data.RAZORPAY_WEBHOOK_SECRET],
      ['NEWSAPI_AI_KEY', data.NEWSAPI_AI_KEY],
      ['SENTRY_DSN', data.SENTRY_DSN],
    ];

    for (const [key, value] of productionRequired) {
      if (!value) {
        missing.push(key);
      }
    }

    if (data.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
    if (data.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production.');
    }
    if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must differ in production.');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      [
        isProduction
          ? 'Missing required production environment variables:'
          : 'Missing required environment variables:',
        ...missing.map((key) => `  - ${key}`),
        '',
        'See server/.env.example and README Production setup.',
      ].join('\n'),
    );
  }

  return {
    port: data.PORT,
    mongodbUri: data.MONGODB_URI,
    jwtSecret: data.JWT_SECRET,
    jwtRefreshSecret: data.JWT_REFRESH_SECRET,
    clientUrl: data.CLIENT_URL,
    anthropicApiKey: data.ANTHROPIC_API_KEY || (stubAiMode ? 'dev-stub-key' : ''),
    anthropicModel: raw.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6',
    anthropicFastModel: raw.ANTHROPIC_FAST_MODEL?.trim() || 'claude-haiku-4-5-20251001',
    nodeEnv,
    deployEnv,
    isProduction,
    isStaging: deployEnv === 'staging',
    isDevelopment: nodeEnv === 'development',
    isTest,
    stubAiMode,
    redisUrl: data.REDIS_URL || '',
    expoAccessToken: data.EXPO_ACCESS_TOKEN || '',
    livekitApiKey: data.LIVEKIT_API_KEY || '',
    livekitApiSecret: data.LIVEKIT_API_SECRET || '',
    livekitUrl: data.LIVEKIT_URL || '',
    livekitRecordingBaseUrl: data.LIVEKIT_RECORDING_BASE_URL || '',
    razorpayKeyId: data.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: data.RAZORPAY_KEY_SECRET || '',
    razorpayWebhookSecret: data.RAZORPAY_WEBHOOK_SECRET || '',
    newsApiAiKey: data.NEWSAPI_AI_KEY || '',
    sentryDsn: data.SENTRY_DSN || '',
    googleClientIds: (data.GOOGLE_CLIENT_IDS || data.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    embeddingProvider:
      raw.EMBEDDING_PROVIDER ??
      (raw.VOYAGE_API_KEY?.trim() ? 'voyage' : 'noop'),
    voyageApiKey: raw.VOYAGE_API_KEY ?? '',
    embeddingModel: raw.EMBEDDING_MODEL ?? 'voyage-3-lite',
    embeddingDimensions: Number(raw.EMBEDDING_DIMENSIONS ?? 512),
    doubtSimilarityThreshold: Number(raw.DOUBT_SIMILARITY_THRESHOLD ?? 0.88),
    questionSimilarityThreshold: Number(raw.QUESTION_SIMILARITY_THRESHOLD ?? 0.92),
    vectorSearchIndexes: Object.freeze({
      questions: raw.VECTOR_INDEX_QUESTIONS ?? 'question_embeddings',
      doubtPosts: raw.VECTOR_INDEX_DOUBT_POSTS ?? 'doubt_post_embeddings',
      aiDoubts: raw.VECTOR_INDEX_AI_DOUBTS ?? 'ai_doubt_embeddings',
    }),
    aiRequestsPerMinute: Number(raw.AI_REQUESTS_PER_MINUTE ?? 12),
    caDigestEnabled: raw.CA_DIGEST_ENABLED !== 'false',
    caDigestSourcesJson: raw.CA_DIGEST_SOURCES ?? '',
    streamingProvider: (raw.STREAMING_PROVIDER ?? 'livekit').toLowerCase(),
  };
}

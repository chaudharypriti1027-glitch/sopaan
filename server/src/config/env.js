import dotenv from 'dotenv';
import { validateEnvironment } from './validateEnv.js';

dotenv.config();

const validated = validateEnvironment(process.env);

export const env = Object.freeze({
  port: validated.port,
  mongodbUri: validated.mongodbUri,
  jwtSecret: validated.jwtSecret,
  jwtRefreshSecret: validated.jwtRefreshSecret,
  anthropicApiKey: validated.anthropicApiKey,
  anthropicModel: validated.anthropicModel,
  anthropicFastModel: validated.anthropicFastModel,
  nodeEnv: validated.nodeEnv,
  deployEnv: validated.deployEnv,
  clientUrl: validated.clientUrl,
  isProduction: validated.isProduction,
  isStaging: validated.isStaging,
  isDevelopment: validated.isDevelopment,
  isTest: validated.isTest,
  stubAiMode: validated.stubAiMode,
  redisUrl: validated.redisUrl,
  expoAccessToken: validated.expoAccessToken,
  livekitApiKey: validated.livekitApiKey,
  livekitApiSecret: validated.livekitApiSecret,
  livekitUrl: validated.livekitUrl,
  livekitRecordingBaseUrl: validated.livekitRecordingBaseUrl,
  razorpayKeyId: validated.razorpayKeyId,
  razorpayKeySecret: validated.razorpayKeySecret,
  razorpayWebhookSecret: validated.razorpayWebhookSecret,
  newsApiAiKey: validated.newsApiAiKey,
  sentryDsn: validated.sentryDsn,
  googleClientIds: validated.googleClientIds,
  embeddingProvider: validated.embeddingProvider,
  voyageApiKey: validated.voyageApiKey,
  embeddingModel: validated.embeddingModel,
  embeddingDimensions: validated.embeddingDimensions,
  doubtSimilarityThreshold: validated.doubtSimilarityThreshold,
  questionSimilarityThreshold: validated.questionSimilarityThreshold,
  vectorSearchIndexes: validated.vectorSearchIndexes,
  aiRequestsPerMinute: validated.aiRequestsPerMinute,
  caDigestEnabled: validated.caDigestEnabled,
  caDigestSourcesJson: validated.caDigestSourcesJson,
  streamingProvider: validated.streamingProvider,
});

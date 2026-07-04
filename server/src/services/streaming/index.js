import { env } from '../../config/env.js';
import { logger } from '../../observability/logger.js';
import { verifyLiveKitApiAccess } from '../livekit.js';
import { devStreamingProvider } from './devStreamingProvider.js';
import { livekitStreamingProvider } from './livekitStreamingProvider.js';
import { noopStreamingProvider } from './noopStreamingProvider.js';

let overrideProvider = null;
/** null = not checked yet, true/false after initStreamingProvider() */
let livekitApiReachable = null;

export function getStreamingProvider() {
  if (overrideProvider) {
    return overrideProvider;
  }

  if (env.streamingProvider === 'dev') {
    return devStreamingProvider;
  }

  if (env.streamingProvider === 'livekit' && livekitStreamingProvider.isConfigured()) {
    if (livekitApiReachable === false && (env.isDevelopment || env.isTest)) {
      return devStreamingProvider;
    }

    return livekitStreamingProvider;
  }

  // Local dev without LiveKit — still allow go-live, chat, and reactions.
  if (env.isDevelopment && !env.isTest) {
    return devStreamingProvider;
  }

  return noopStreamingProvider;
}

export function isStreamingConfigured() {
  return getStreamingProvider().isConfigured();
}

export async function initStreamingProvider() {
  if (overrideProvider || env.streamingProvider !== 'livekit' || !livekitStreamingProvider.isConfigured()) {
    livekitApiReachable = false;
    return getStreamingProvider();
  }

  if (env.isTest) {
    livekitApiReachable = false;
    return getStreamingProvider();
  }

  livekitApiReachable = await verifyLiveKitApiAccess();

  if (!livekitApiReachable && env.isDevelopment) {
    console.warn(
      '[streaming] LiveKit rejected your API credentials — using dev streaming for local classes.',
    );
    console.warn(
      '[streaming] Fix: open https://cloud.livekit.io → Project → Settings → Keys → copy API Secret (not your login password) into LIVEKIT_API_SECRET in server/.env, then restart.',
    );
  }

  return getStreamingProvider();
}

export async function safeCreateStreamingRoom(provider, options) {
  if (!provider?.isConfigured?.() || typeof provider.createRoom !== 'function') {
    return null;
  }

  try {
    return await provider.createRoom(options);
  } catch (err) {
    const fallback = getStreamingProvider();
    if (fallback.id !== provider.id && typeof fallback.createRoom === 'function') {
      logger.warn('streaming room create failed — using fallback provider', {
        from: provider.id,
        to: fallback.id,
        error: err?.message ?? String(err),
      });
      return fallback.createRoom(options);
    }

    throw err;
  }
}

export function resetStreamingProviderForTests() {
  overrideProvider = null;
  livekitApiReachable = null;
}

export function setStreamingProviderForTests(provider) {
  overrideProvider = provider;
}

export function setLiveKitReachableForTests(value) {
  livekitApiReachable = value;
}

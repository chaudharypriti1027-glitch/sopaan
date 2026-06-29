import { env } from '../../config/env.js';
import { livekitStreamingProvider } from './livekitStreamingProvider.js';
import { noopStreamingProvider } from './noopStreamingProvider.js';

let overrideProvider = null;

export function getStreamingProvider() {
  if (overrideProvider) {
    return overrideProvider;
  }

  if (env.streamingProvider === 'livekit' && livekitStreamingProvider.isConfigured()) {
    return livekitStreamingProvider;
  }

  return noopStreamingProvider;
}

export function isStreamingConfigured() {
  return getStreamingProvider().isConfigured();
}

export function resetStreamingProviderForTests() {
  overrideProvider = null;
}

export function setStreamingProviderForTests(provider) {
  overrideProvider = provider;
}

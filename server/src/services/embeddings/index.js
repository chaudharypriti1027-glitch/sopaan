import { env } from '../../config/env.js';
import { createNoopEmbeddingProvider } from './noopEmbeddingProvider.js';
import { createVoyageEmbeddingProvider } from './voyageEmbeddingProvider.js';

let cachedProvider;

/**
 * @typedef {object} EmbeddingProvider
 * @property {string} name
 * @property {string} model
 * @property {number} dimensions
 * @property {(texts: string[]) => Promise<number[][]>} embed
 * @property {(texts: string[]) => Promise<number[][]>} embedQuery
 */

export function createEmbeddingProvider(options = env) {
  const dimensions = options.embeddingDimensions;
  const model = options.embeddingModel;

  if (options.embeddingProvider === 'voyage') {
    try {
      return createVoyageEmbeddingProvider({
        apiKey: options.voyageApiKey,
        model,
        dimensions,
      });
    } catch (err) {
      if (options.isProduction) {
        throw err;
      }

      console.warn(`[embeddings] Voyage unavailable (${err.message}); falling back to noop provider`);
    }
  }

  return createNoopEmbeddingProvider({ dimensions, model });
}

export function getEmbeddingProvider() {
  if (!cachedProvider) {
    cachedProvider = createEmbeddingProvider();
  }

  return cachedProvider;
}

export function resetEmbeddingProviderForTests() {
  cachedProvider = undefined;
}

export async function embedDocument(text) {
  const provider = getEmbeddingProvider();
  const normalized = text.trim();

  if (!normalized) {
    throw new Error('Cannot embed empty text');
  }

  const [vector] = await provider.embed([normalized]);
  return vector;
}

export async function embedQuery(text) {
  const provider = getEmbeddingProvider();
  const normalized = text.trim();

  if (!normalized) {
    throw new Error('Cannot embed empty text');
  }

  const [vector] = await provider.embedQuery([normalized]);
  return vector;
}

export async function embedDocuments(texts) {
  const provider = getEmbeddingProvider();
  const normalized = texts.map((text) => text.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return [];
  }

  return provider.embed(normalized);
}

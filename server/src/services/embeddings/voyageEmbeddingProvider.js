import { AppError } from '../../utils/AppError.js';

async function requestEmbeddings({ apiKey, model, texts, inputType }) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model,
      input_type: inputType,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      `Voyage embedding request failed (${response.status}): ${body.slice(0, 200)}`,
      502,
      'EMBEDDING_FAILED',
    );
  }

  const payload = await response.json();
  return payload.data?.map((item) => item.embedding) ?? [];
}

/**
 * Voyage AI embeddings provider.
 * @see https://docs.voyageai.com/reference/embeddings-api
 * @param {{ apiKey: string, model: string, dimensions: number }} config
 */
export function createVoyageEmbeddingProvider({ apiKey, model, dimensions }) {
  if (!apiKey?.trim()) {
    throw new AppError('VOYAGE_API_KEY is required when EMBEDDING_PROVIDER=voyage', 500, 'CONFIG_ERROR');
  }

  async function embedWithType(texts, inputType) {
    const vectors = await requestEmbeddings({ apiKey, model, texts, inputType });

    if (vectors.length !== texts.length) {
      throw new AppError('Voyage returned an unexpected embedding count', 502, 'EMBEDDING_FAILED');
    }

    for (const vector of vectors) {
      if (!Array.isArray(vector) || vector.length !== dimensions) {
        throw new AppError(
          `Expected ${dimensions}-dimension embeddings from Voyage`,
          502,
          'EMBEDDING_FAILED',
        );
      }
    }

    return vectors;
  }

  return {
    name: 'voyage',
    model,
    dimensions,

    embed(texts) {
      return embedWithType(texts, 'document');
    },

    embedQuery(texts) {
      return embedWithType(texts, 'query');
    },
  };
}

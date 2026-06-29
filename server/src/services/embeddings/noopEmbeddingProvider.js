import { createHash } from 'node:crypto';

function pseudoVector(text, dimensions) {
  const hash = createHash('sha256').update(text).digest();
  const vector = new Array(dimensions);

  for (let index = 0; index < dimensions; index += 1) {
    const byte = hash[index % hash.length];
    vector[index] = (byte / 255) * 2 - 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

/**
 * Deterministic local embedding provider for tests and dev without an API key.
 * @param {{ dimensions: number, model: string }} config
 */
export function createNoopEmbeddingProvider({ dimensions, model }) {
  return {
    name: 'noop',
    model,
    dimensions,

    async embed(texts) {
      return texts.map((text) => pseudoVector(text, dimensions));
    },

    async embedQuery(texts) {
      return texts.map((text) => pseudoVector(text, dimensions));
    },
  };
}

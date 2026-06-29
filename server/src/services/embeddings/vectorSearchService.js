import { env } from '../../config/env.js';
import { rankBySimilarity } from './cosineSimilarity.js';

function buildVectorFilter(filter = {}) {
  const clauses = Object.entries(filter)
    .filter(([, value]) => value != null && value !== '')
    .map(([field, value]) => ({
      equals: {
        path: field,
        value,
      },
    }));

  if (clauses.length === 0) {
    return undefined;
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { compound: { filter: clauses } };
}

/**
 * Run MongoDB Atlas Vector Search when available, otherwise fall back to in-memory cosine ranking.
 */
export async function vectorSearch({
  model,
  indexName,
  queryVector,
  filter = {},
  limit = 5,
  minScore = 0,
  numCandidates = 100,
}) {
  const atlasFilter = buildVectorFilter(filter);

  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector,
          numCandidates,
          limit,
          ...(atlasFilter ? { filter: atlasFilter } : {}),
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          score: { $gte: minScore },
        },
      },
    ];

    const results = await model.aggregate(pipeline);
    return results;
  } catch (err) {
    if (env.isProduction) {
      console.warn(`[vectorSearch] Atlas search failed on ${indexName}: ${err.message}`);
    }

    const query = {
      embedding: { $exists: true, $ne: [] },
      ...filter,
    };

    const candidates = await model
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(Math.max(numCandidates, limit * 10))
      .lean();

    return rankBySimilarity(queryVector, candidates, { minScore, limit });
  }
}

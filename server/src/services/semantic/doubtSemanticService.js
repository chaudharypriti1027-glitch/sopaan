import { env } from '../../config/env.js';
import { AiDoubtCache } from '../../models/AiDoubtCache.js';
import { DoubtPost } from '../../models/DoubtPost.js';
import { embedDocument, embedQuery, getEmbeddingProvider } from '../embeddings/index.js';
import { vectorSearch } from '../embeddings/vectorSearchService.js';

export function buildDoubtSearchText({ title, body }) {
  return `${title}\n${body}`.trim();
}

export function pickBestAnswer(answers = []) {
  if (!answers.length) {
    return null;
  }

  const sorted = [...answers].sort((left, right) => {
    const voteDiff = (right.votes ?? 0) - (left.votes ?? 0);

    if (voteDiff !== 0) {
      return voteDiff;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return sorted[0]?.body?.trim() ?? null;
}

export async function embedDoubtPost(doubtPost) {
  if (!doubtPost?.answers?.length) {
    return doubtPost;
  }

  const bestAnswer = pickBestAnswer(doubtPost.answers);
  const searchText = buildDoubtSearchText(doubtPost);

  if (!searchText || !bestAnswer) {
    return doubtPost;
  }

  const provider = getEmbeddingProvider();
  doubtPost.bestAnswer = bestAnswer;
  doubtPost.hasAnswer = true;
  doubtPost.embedding = await embedDocument(searchText);
  doubtPost.embeddingModel = provider.model;
  await doubtPost.save();

  return doubtPost;
}

export async function cacheAiDoubtAnswer({ queryText, explanation, language = 'en', userId }) {
  const normalizedQuery = queryText.trim();
  const normalizedExplanation = explanation.trim();

  if (!normalizedQuery || !normalizedExplanation) {
    return null;
  }

  const provider = getEmbeddingProvider();
  const embedding = await embedDocument(normalizedQuery);

  return AiDoubtCache.create({
    queryText: normalizedQuery,
    explanation: normalizedExplanation,
    language,
    userId,
    embedding,
    embeddingModel: provider.model,
  });
}

function formatMatch(doc, source) {
  return {
    id: doc._id.toString(),
    source,
    score: doc.score,
    queryText: doc.queryText ?? buildDoubtSearchText(doc),
    title: doc.title,
    explanation: doc.explanation ?? doc.bestAnswer,
  };
}

export async function findSimilarAnsweredDoubts(queryText, { language, limit = 3 } = {}) {
  const normalized = queryText.trim();

  if (!normalized) {
    return [];
  }

  const queryVector = await embedQuery(normalized);
  const filter = language ? { language } : {};

  const [aiMatches, forumMatches] = await Promise.all([
    vectorSearch({
      model: AiDoubtCache,
      indexName: env.vectorSearchIndexes.aiDoubts,
      queryVector,
      filter,
      limit,
      minScore: env.doubtSimilarityThreshold,
    }),
    vectorSearch({
      model: DoubtPost,
      indexName: env.vectorSearchIndexes.doubtPosts,
      queryVector,
      filter: {
        ...filter,
        hasAnswer: true,
      },
      limit,
      minScore: env.doubtSimilarityThreshold,
    }),
  ]);

  return [...aiMatches.map((doc) => formatMatch(doc, 'ai_cache')), ...forumMatches.map((doc) => formatMatch(doc, 'forum_doubt'))]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function recordAiDoubtCacheHit(cacheId) {
  await AiDoubtCache.findByIdAndUpdate(cacheId, { $inc: { hitCount: 1 } });
}

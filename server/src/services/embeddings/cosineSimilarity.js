export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function rankBySimilarity(queryVector, documents, { minScore = 0, limit = 5 } = {}) {
  return documents
    .filter((doc) => Array.isArray(doc.embedding) && doc.embedding.length === queryVector.length)
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.embedding),
    }))
    .filter((doc) => doc.score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

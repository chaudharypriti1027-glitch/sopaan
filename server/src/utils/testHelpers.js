export function sanitizeQuestionForAttempt(question) {
  if (!question) {
    return question;
  }

  const value = typeof question.toObject === 'function' ? question.toObject() : { ...question };
  delete value.correctKey;
  delete value.explanation;
  return value;
}

export function computeRankAndPercentile(scores, userScore) {
  if (!scores.length) {
    return { rank: 1, percentile: 100 };
  }

  const rank = scores.filter((score) => score > userScore).length + 1;
  const belowCount = scores.filter((score) => score < userScore).length;
  const percentile = Math.round((belowCount / scores.length) * 100);

  return { rank, percentile };
}

export function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function subtractDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() - days);
  return value;
}

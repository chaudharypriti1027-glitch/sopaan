export async function generateAttemptFeedback({ attempt, test, weakTopics }) {
  const topicsText =
    weakTopics.length > 0 ? weakTopics.join(', ') : 'no specific weak areas detected';

  return [
    `You scored ${attempt.score}/${attempt.answers.length} (${attempt.accuracy}%) on "${test.title}".`,
    `Total time: ${Math.round((attempt.totalTimeSec ?? 0) / 60)} minutes.`,
    `Priority revision topics: ${topicsText}.`,
    'Recommendation: review incorrect questions, then attempt a focused sectional test on weak topics.',
  ].join(' ');
}

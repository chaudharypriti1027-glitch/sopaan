const GAME_FOCUS = {
  'memory-match': 'Memory & recall',
  'word-scramble': 'Vocabulary',
  'gk-bingo': 'General knowledge',
  'rapid-fire': 'Current affairs & GK',
  'crossword': 'Vocabulary',
  'map-quiz': 'Geography',
  'math-blitz': 'Quantitative aptitude',
  'grammar-fix': 'English grammar',
  'science-lab': 'Science',
  'history-line': 'History',
  'spelling-bee': 'Spelling',
  'flag-master': 'Geography',
  'logic-puzzle': 'Logical reasoning',
  'number-ninja': 'Mental math',
  'word-chain': 'Vocabulary',
  'world-quiz': 'World GK',
  'trivia-blitz': 'Mixed GK',
  'code-breaker': 'Reasoning',
  'story-builder': 'Language comprehension',
};

function uniqueTopics(items) {
  return [...new Set(items.filter((item) => typeof item === 'string' && item.trim()))];
}

function buildReviewItems(answers) {
  return answers.map((answer) => ({
    questionId: answer.questionId,
    prompt: answer.prompt ?? 'Question',
    topic: answer.topic ?? null,
    selected: answer.selected ?? null,
    correct: Boolean(answer.correct),
    correctAnswer: answer.correctAnswer ?? null,
    explanation: answer.explanation ?? null,
  }));
}

export function instantGameCoaching({
  gameId,
  gameTitle,
  score,
  answers = [],
  affairTitle,
  examTrack,
}) {
  const focusArea = GAME_FOCUS[gameId] ?? 'Exam practice';
  const displayTitle = affairTitle || gameTitle || focusArea;
  const total = answers.length;
  const correct = answers.filter((item) => item.correct).length;
  const wrong = answers.filter((item) => !item.correct);

  const weakTopics = uniqueTopics(
    wrong.map((item) => item.topic || focusArea),
  ).slice(0, 3);

  let feedback;
  if (total > 0) {
    feedback =
      score >= 80
        ? `Strong work — ${correct}/${total} correct (${score}%) on "${displayTitle}". Keep revising ${weakTopics[0] ?? focusArea} to stay exam-ready.`
        : score >= 50
          ? `You scored ${correct}/${total} (${score}%) on "${displayTitle}". ${
              weakTopics.length
                ? `Focus next on ${weakTopics.slice(0, 2).join(' and ')}.`
                : 'Review the solutions below and try again.'
            }`
          : `You got ${correct}/${total} (${score}%) on "${displayTitle}". Slow down, read each stem twice, then drill ${
              weakTopics[0] ?? focusArea
            }.`;
  } else if (score >= 80) {
    feedback = `Excellent ${score}% on "${displayTitle}"! ${examTrack ? `This builds ${examTrack} stamina.` : 'Keep your daily streak going.'}`;
  } else if (score >= 50) {
    feedback = `Good effort — ${score}% on "${displayTitle}". One more round on ${focusArea} will sharpen accuracy.`;
  } else {
    feedback = `You scored ${score}% on "${displayTitle}". Replay after a quick revision of ${focusArea}.`;
  }

  const actions =
    weakTopics.length > 0
      ? [
          `Read today's affair and note facts linked to ${weakTopics[0]}.`,
          `Generate an AI sectional test on ${weakTopics[0] ?? focusArea}.`,
        ]
      : [
          'Attempt the daily GK challenge again tomorrow.',
          `Open Practice and generate a short ${focusArea} drill.`,
        ];

  const reviewSource = wrong.length ? wrong : answers.slice(0, Math.min(3, answers.length));

  return {
    coaching: {
      feedback,
      weakTopics,
      actions,
    },
    review: buildReviewItems(reviewSource),
  };
}

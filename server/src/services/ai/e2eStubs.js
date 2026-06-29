import { Question } from '../../models/Question.js';

const E2E_QUESTION_TEMPLATES = [
  {
    subject: 'General Studies',
    topic: 'Indian Polity',
    difficulty: 'easy',
    text: 'Which article of the Indian Constitution deals with the Right to Equality?',
    options: [
      { key: 'A', text: 'Article 14' },
      { key: 'B', text: 'Article 19' },
      { key: 'C', text: 'Article 21' },
      { key: 'D', text: 'Article 32' },
    ],
    correctKey: 'A',
    explanation: 'Article 14 guarantees equality before the law.',
  },
  {
    subject: 'General Studies',
    topic: 'Indian Polity',
    difficulty: 'easy',
    text: 'Who is the head of state in India?',
    options: [
      { key: 'A', text: 'Prime Minister' },
      { key: 'B', text: 'President' },
      { key: 'C', text: 'Chief Justice' },
      { key: 'D', text: 'Speaker of Lok Sabha' },
    ],
    correctKey: 'B',
    explanation: 'The President is the head of state.',
  },
  {
    subject: 'General Studies',
    topic: 'Indian Polity',
    difficulty: 'medium',
    text: 'How many schedules are in the Indian Constitution?',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '12' },
      { key: 'C', text: '14' },
      { key: 'D', text: '16' },
    ],
    correctKey: 'B',
    explanation: 'The Constitution originally had 8 schedules; it now has 12.',
  },
  {
    subject: 'General Studies',
    topic: 'Economy',
    difficulty: 'medium',
    text: 'GDP stands for:',
    options: [
      { key: 'A', text: 'Gross Domestic Product' },
      { key: 'B', text: 'General Development Plan' },
      { key: 'C', text: 'Government Debt Portfolio' },
      { key: 'D', text: 'Gross Dividend Payout' },
    ],
    correctKey: 'A',
    explanation: 'GDP measures the total value of goods and services produced.',
  },
  {
    subject: 'General Studies',
    topic: 'History',
    difficulty: 'easy',
    text: 'In which year did India gain independence?',
    options: [
      { key: 'A', text: '1945' },
      { key: 'B', text: '1947' },
      { key: 'C', text: '1950' },
      { key: 'D', text: '1930' },
    ],
    correctKey: 'B',
    explanation: 'India became independent on 15 August 1947.',
  },
];

export function stubDoubtAnswer(question, { imageScan = false } = {}) {
  const topic = question.trim().slice(0, 120);
  const prefix = imageScan
    ? 'Local dev stub for scanned question.'
    : topic
      ? `Local dev stub for: ${topic}.`
      : 'Local dev stub answer.';

  return {
    explanation: `${prefix} Break the problem into steps, apply the relevant concept or formula, and verify units before submitting.`,
    fromCache: false,
  };
}

export function stubAnswerEvaluation(maxMarks = 10) {
  const score = Math.min(maxMarks, Math.max(1, Math.round(maxMarks * 0.75)));

  return {
    score,
    subScores: {
      content: Math.min(maxMarks, Math.max(1, Math.round(maxMarks * 0.35))),
      structure: Math.min(maxMarks, Math.max(1, Math.round(maxMarks * 0.25))),
      clarity: Math.min(maxMarks, Math.max(1, Math.round(maxMarks * 0.15))),
    },
    feedback: [
      'Local dev stub: Clear structure and main points covered.',
      'Add one concrete example or fact to strengthen the answer.',
    ],
  };
}

export function stubAttemptCoaching({ attempt, test }) {
  return {
    feedback: `E2E coaching: you scored ${attempt.score}/${attempt.answers.length} on "${test.title}". Focus on weak topics next.`,
    weakTopics: attempt.weakTopics?.length ? attempt.weakTopics : ['Indian Polity'],
    actions: [
      'Review incorrect answers in the result screen.',
      'Attempt a focused sectional test on weak topics.',
    ],
  };
}

export function stubCurrentAffairSummary(title) {
  const pick = (index) => E2E_QUESTION_TEMPLATES[index % E2E_QUESTION_TEMPLATES.length];

  return {
    summary: `Dev stub summary for "${title.trim().slice(0, 100)}". Focus on key facts, dates, and why this matters for competitive exams.`,
    category: 'National',
    quizQuestions: [pick(0), pick(1), pick(2)].map((template) => ({
      text: template.text,
      options: template.options,
      correctKey: template.correctKey,
      explanation: template.explanation,
      subject: template.subject,
      topic: template.topic,
      difficulty: template.difficulty,
    })),
  };
}

export async function stubQuestionBatch({ subject, topic, difficulty, count, examTag, userId }) {
  const docs = [];

  for (let i = 0; i < count; i += 1) {
    const template = E2E_QUESTION_TEMPLATES[i % E2E_QUESTION_TEMPLATES.length];
    const doc = await Question.create({
      subject,
      topic,
      difficulty,
      text: template.text,
      options: template.options,
      correctKey: template.correctKey,
      explanation: template.explanation,
      examTags: [examTag],
      source: 'e2e_stub',
      language: 'en',
      createdBy: userId,
    });
    docs.push(doc);
  }

  return docs;
}

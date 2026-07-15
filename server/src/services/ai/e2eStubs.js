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
    explanation: `${prefix}\nAnswer: ${topic ? `For "${topic.slice(0, 80)}", ` : ''}apply the core concept and state the final result first.\nExplanation:\n- Identify what the question is really asking.\n- Use one formula or rule, then verify the result.`,
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
    strengths: [
      'Local dev stub: Clear structure and main points covered.',
    ],
    feedback: [
      'Add one concrete example or fact to strengthen the answer.',
      'Tighten the conclusion so it directly answers the question.',
    ],
    nextSteps: [
      'Rewrite the answer once with one example and a sharper conclusion.',
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
    shortAnswer: 'This headline is exam-relevant because it may appear in GK or current-affairs sections.',
    examTip: 'Link the main entity, date, and policy outcome when you revise this topic.',
    keyPoints: [
      'Note the main organisation or ministry involved.',
      'Remember the headline date for chronology questions.',
      'Connect this topic to your target exam syllabus.',
    ],
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

export function stubBookChapterContent({ chapterTitle, chapterIndex, totalChapters }) {
  return {
    summary: `Dev stub summary for "${chapterTitle}" (chapter ${chapterIndex + 1} of ${totalChapters}).`,
    pages: [
      {
        html: `<h2>${chapterTitle}</h2><p>Stub page one with a worked example: step 1, step 2, step 3.</p><ul><li>Key point alpha</li><li>Key point beta</li></ul>`,
      },
      {
        html: `<p>Stub page two — practice problems and exam tips for ${chapterTitle}.</p><ol><li>Review formula sheet</li><li>Attempt 10 MCQs</li></ol>`,
      },
    ],
  };
}

export function stubBookExplain(passage) {
  const excerpt = passage.trim().slice(0, 80);
  return `This passage is about "${excerpt}". Think of it like a quick revision note — focus on the core idea, not extra details. Remember this: stick to what the text says when you answer exam questions.`;
}

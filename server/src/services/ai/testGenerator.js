import { Test } from '../../models/Test.js';
import { AppError } from '../../utils/AppError.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { complete } from './claudeClient.js';
import { stubQuestionBatch } from './e2eStubs.js';
import { TEST_GENERATION_RUBRIC } from './prompts/stablePrompts.js';
import { validateQuestionBatch } from './outputValidation.js';
import { insertQuestionsWithDedup } from '../semantic/questionSemanticService.js';
import { languageSuffix } from '../../utils/languageLabel.js';

export const SECONDS_PER_QUESTION = 90;
const MAX_GENERATION_ATTEMPTS = 3;

function buildUserPrompt({ subject, topic, difficulty, count, examTag, language }) {
  return `Generate ${count} multiple-choice questions for:
- Exam track: ${examTag}
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty}
- Language: ${language}

Return ONLY the JSON array.`;
}

async function fetchValidatedQuestions({
  subject,
  topic,
  difficulty,
  count,
  examTag,
  language,
  userId,
}) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const rawResponse = await complete({
        stableSystem: TEST_GENERATION_RUBRIC,
        dynamicSystemSuffix: languageSuffix(language),
        user: buildUserPrompt({ subject, topic, difficulty, count, examTag, language }),
        tier: 'quality',
        feature: 'test_generation',
        userId,
        maxTokens: Math.min(8192, count * 900),
        json: true,
        timeoutMs: 120_000,
      });

      return validateQuestionBatch(rawResponse, count);
    } catch (err) {
      lastError = err;

      if (err instanceof AppError && err.code !== 'AI_RESPONSE_INVALID') {
        throw err;
      }

      if (attempt === MAX_GENERATION_ATTEMPTS) {
        break;
      }

      console.warn(`[testGenerator] Generation validation failed (attempt ${attempt}): ${err.message}`);
    }
  }

  if (lastError instanceof AppError) {
    throw lastError;
  }

  throw new AppError(
    lastError?.message ?? 'AI test generation failed validation',
    502,
    'AI_RESPONSE_INVALID',
  );
}

export async function generateQuestionBatch({
  subject,
  topic,
  difficulty,
  count,
  examTag,
  language,
  userId,
}) {
  if (aiRuntimeConfig.stubResponses) {
    return stubQuestionBatch({ subject, topic, difficulty, count, examTag, userId });
  }

  const validatedQuestions = await fetchValidatedQuestions({
    subject,
    topic,
    difficulty,
    count,
    examTag,
    language,
    userId,
  });

  const { questions: questionDocs, reusedCount } = await insertQuestionsWithDedup(
    validatedQuestions,
    {
      subject,
      examTag,
      language,
      userId,
    },
  );

  if (reusedCount > 0) {
    console.info(
      `[testGenerator] Flagged ${reusedCount} near-duplicate question(s) for review in ${subject}/${topic}`,
    );
  }

  return questionDocs;
}

function resolveTestStatus() {
  return 'published';
}

export async function generateTest({
  subject,
  topic,
  difficulty,
  count,
  examTag,
  language,
  userId,
  userRole,
  adaptive = false,
}) {
  if (adaptive) {
    const { createAdaptivePracticeTest } = await import('../adaptive/practiceService.js');
    const { test } = await createAdaptivePracticeTest({
      userId,
      userRole,
      subject,
      topic,
      count,
      examTag,
      language,
    });
    return test;
  }

  const questionDocs = await generateQuestionBatch({
    subject,
    topic,
    difficulty,
    count,
    examTag,
    language,
    userId,
  });

  const test = await Test.create({
    title: `${subject} — ${topic} (${difficulty})`,
    subject,
    topic,
    difficulty,
    durationSec: count * SECONDS_PER_QUESTION,
    questions: questionDocs.map((question) => question._id),
    type: 'sectional',
    examTag,
    createdBy: userId,
    status: resolveTestStatus(),
  });

  return test.populate('questions');
}

export async function generateMultiSectionExam({
  title,
  examTag,
  language,
  difficulty,
  sections,
  userId,
  publish = false,
}) {
  const sectionPreviews = [];
  const allQuestionIds = [];

  for (const section of sections) {
    const questionDocs = await generateQuestionBatch({
      subject: section.subject,
      topic: section.topic,
      difficulty: section.difficulty ?? difficulty,
      count: section.count,
      examTag,
      language,
      userId,
    });

    allQuestionIds.push(...questionDocs.map((question) => question._id));
    sectionPreviews.push({
      subject: section.subject,
      topic: section.topic,
      difficulty: section.difficulty ?? difficulty,
      questionCount: questionDocs.length,
      questions: questionDocs,
    });
  }

  const test = await Test.create({
    title,
    subject: 'Mixed',
    topic: 'All Sections',
    difficulty,
    durationSec: allQuestionIds.length * SECONDS_PER_QUESTION,
    questions: allQuestionIds,
    type: 'mock',
    examTag,
    createdBy: userId,
    status: publish ? 'published' : 'draft',
  });

  const populated = await test.populate('questions');

  return {
    preview: !publish,
    test: populated,
    sections: sectionPreviews,
    totalQuestions: allQuestionIds.length,
    totalDurationSec: test.durationSec,
  };
}

import { z } from 'zod';
import { Attempt } from '../../models/Attempt.js';
import { PlannerSession } from '../../models/PlannerSession.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { complete } from './claudeClient.js';
import { PRACTICE_SUGGESTIONS_RUBRIC } from './prompts/stablePrompts.js';
import { languageSuffix } from '../../utils/languageLabel.js';
import { resolveExamTrackForUser } from '../../utils/resolveExamTrackForUser.js';

const suggestionSchema = z.object({
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mode: z.enum(['standard', 'adaptive']),
  count: z.coerce.number().int().min(5).max(20),
  reason: z.string().trim().min(1),
});

const suggestionsResponseSchema = z.object({
  suggestions: z.array(suggestionSchema).min(1).max(6),
});

const QUANT_EXAM_PATTERN = /ssc|bank|ibps|railway|rrb/i;

function inferSubject(topic) {
  const normalized = topic.toLowerCase();

  if (
    normalized.includes('quant') ||
    normalized.includes('math') ||
    normalized.includes('di') ||
    normalized.includes('percentage')
  ) {
    return 'Quantitative Aptitude';
  }

  if (
    normalized.includes('reason') ||
    normalized.includes('puzzle') ||
    normalized.includes('logic')
  ) {
    return 'Reasoning';
  }

  if (normalized.includes('english') || normalized.includes('grammar')) {
    return 'English';
  }

  return 'General Studies';
}

function dedupeSuggestions(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.subject.toLowerCase()}::${item.topic.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function collectWeakTopics(userId) {
  const attempts = await Attempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('weakTopics accuracy')
    .lean();

  const counts = new Map();

  for (const attempt of attempts) {
    for (const topic of attempt.weakTopics ?? []) {
      if (!topic?.trim()) {
        continue;
      }
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  const accuracies = attempts
    .map((attempt) => attempt.accuracy)
    .filter((value) => typeof value === 'number');

  const avgAccuracy = accuracies.length
    ? accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length
    : null;

  return {
    weakTopics: [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([topic]) => topic)
      .slice(0, 5),
    avgAccuracy,
  };
}

async function collectPlannerTopics(userId) {
  const sessions = await PlannerSession.find({ userId })
    .sort({ date: 1 })
    .limit(12)
    .select('subject topic completed')
    .lean();

  return sessions
    .filter((session) => session.subject?.trim() && session.topic?.trim())
    .map((session) => ({
      subject: session.subject.trim(),
      topic: session.topic.trim(),
      completed: Boolean(session.completed),
    }))
    .slice(0, 4);
}

export async function collectPracticeSuggestionContext(userId, user) {
  const [profile, weakData, plannerTopics] = await Promise.all([
    StudentProfile.findOne({ userId }).select('goal').lean(),
    collectWeakTopics(userId),
    collectPlannerTopics(userId),
  ]);

  const examTag = resolveExamTrackForUser(user, profile);

  return {
    examTag,
    weakTopics: weakData.weakTopics,
    avgAccuracy: weakData.avgAccuracy,
    plannerTopics,
  };
}

function buildHeuristicSuggestions({
  examTag,
  weakTopics,
  plannerTopics,
  avgAccuracy,
  language,
  currentSubject,
  currentTopic,
}) {
  const isHi = language === 'hi';
  const suggestions = [];
  const difficultyForWeak =
    avgAccuracy != null && avgAccuracy < 55 ? 'easy' : avgAccuracy != null && avgAccuracy > 75 ? 'hard' : 'medium';

  if (currentSubject?.trim() && currentTopic?.trim()) {
    suggestions.push({
      subject: currentSubject.trim(),
      topic: currentTopic.trim(),
      difficulty: 'medium',
      mode: 'standard',
      count: 10,
      reason: isHi
        ? `${currentTopic.trim()} पर गहन अभ्यास — वही विषय, थोड़ा कठिन स्तर।`
        : `Deepen ${currentTopic.trim()} with a focused drill at your chosen level.`,
    });
  }

  for (const topic of weakTopics.slice(0, 2)) {
    suggestions.push({
      subject: inferSubject(topic),
      topic,
      difficulty: difficultyForWeak,
      mode: 'adaptive',
      count: 10,
      reason: isHi
        ? `हाल के प्रयासों में ${topic} कमज़ोर रहा — अनुकूली ड्रिल से सुधार करें।`
        : `${topic} showed up in recent weak areas — adaptive drill to close the gap.`,
    });
  }

  for (const session of plannerTopics.filter((item) => !item.completed).slice(0, 1)) {
    suggestions.push({
      subject: session.subject,
      topic: session.topic,
      difficulty: 'medium',
      mode: 'standard',
      count: 12,
      reason: isHi
        ? `आज की योजना में ${session.topic} है — समय पर पूरा करें।`
        : `${session.topic} is on your plan today — finish it with a timed set.`,
    });
  }

  if (QUANT_EXAM_PATTERN.test(examTag)) {
    suggestions.push({
      subject: 'Quantitative Aptitude',
      topic: 'Data Interpretation',
      difficulty: 'medium',
      mode: 'standard',
      count: 15,
      reason: isHi
        ? `${examTag || 'इस परीक्षा'} में DI अक्सर निर्णायक होता है — गति बढ़ाएँ।`
        : `DI sets are high-yield for ${examTag || 'your exam'} — build speed with a timed drill.`,
    });
  } else {
    suggestions.push({
      subject: 'General Studies',
      topic: 'Current Affairs',
      difficulty: 'medium',
      mode: 'adaptive',
      count: 10,
      reason: isHi
        ? 'हाल की घटनाओं पर ताज़ा अभ्यास — परीक्षा में अक्सर पूछा जाता है।'
        : 'Fresh current-affairs practice — frequently tested across many exams.',
    });
  }

  suggestions.push({
    subject: 'Reasoning',
    topic: 'Puzzles & Seating',
    difficulty: avgAccuracy != null && avgAccuracy < 60 ? 'easy' : 'medium',
    mode: 'standard',
    count: 8,
    reason: isHi
      ? 'तर्कशक्ति पर छोटा सेट — सटीकता और गति दोनों बढ़ती हैं।'
      : 'Short reasoning set to sharpen accuracy without fatigue.',
  });

  return dedupeSuggestions(suggestions).slice(0, 4);
}

function stubPracticeSuggestions(context, language) {
  return buildHeuristicSuggestions({
    ...context,
    language,
    currentSubject: '',
    currentTopic: '',
  });
}

function validateSuggestions(raw) {
  const parsed = suggestionsResponseSchema.safeParse(
    typeof raw === 'string' ? JSON.parse(raw) : raw,
  );

  if (!parsed.success) {
    const message = parsed.error.errors.map((issue) => issue.message).join(', ');
    throw new Error(`AI practice suggestions invalid: ${message}`);
  }

  return dedupeSuggestions(parsed.data.suggestions).slice(0, 4);
}

export async function suggestPracticeOptions({
  userId,
  user,
  examTag,
  subject,
  topic,
  language = 'en',
}) {
  const context = await collectPracticeSuggestionContext(userId, user);
  const resolvedExamTag = examTag?.trim() || context.examTag || 'SSC-CGL';
  const enrichedContext = { ...context, examTag: resolvedExamTag };

  if (aiRuntimeConfig.stubResponses) {
    return {
      suggestions: stubPracticeSuggestions(enrichedContext, language),
      source: 'heuristic',
    };
  }

  const heuristic = buildHeuristicSuggestions({
    ...enrichedContext,
    language,
    currentSubject: subject,
    currentTopic: topic,
  });

  try {
    const raw = await complete({
      stableSystem: PRACTICE_SUGGESTIONS_RUBRIC,
      dynamicSystemSuffix: languageSuffix(language),
      user: JSON.stringify({
        examTrack: resolvedExamTag,
        weakTopics: enrichedContext.weakTopics,
        plannerTopics: enrichedContext.plannerTopics,
        avgAccuracy: enrichedContext.avgAccuracy,
        currentSubject: subject?.trim() || null,
        currentTopic: topic?.trim() || null,
      }),
      tier: 'fast',
      feature: 'practice_suggestions',
      userId,
      maxTokens: 1200,
      json: true,
      timeoutMs: 25_000,
    });

    const suggestions = validateSuggestions(raw);
    return { suggestions, source: 'ai' };
  } catch (error) {
    console.warn(`[practiceSuggestions] AI fallback: ${error.message}`);
    return { suggestions: heuristic, source: 'heuristic' };
  }
}

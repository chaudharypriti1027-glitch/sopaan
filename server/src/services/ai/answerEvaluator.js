import { AppError } from '../../utils/AppError.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { respondInLanguageSuffix } from '../../utils/languageLabel.js';
import { complete, buildMessageContent } from './claudeClient.js';
import { stubAnswerEvaluation } from './e2eStubs.js';
import { ANSWER_EVALUATION_RUBRIC } from './prompts/stablePrompts.js';
import { validateAnswerEvaluation } from './outputValidation.js';

const MAX_EVALUATION_ATTEMPTS = 2;

export async function evaluateAnswer({
  question,
  answerText,
  maxMarks = 10,
  imageBase64,
  language = 'en',
  userId,
}) {
  if (aiRuntimeConfig.stubResponses) {
    return stubAnswerEvaluation(maxMarks);
  }

  const textBlock = imageBase64
    ? `Question: ${question}\nMax marks: ${maxMarks}\nThe student's handwritten answer is in the attached image. Transcribe it, then evaluate.\n${answerText ? `Typed answer (if any): ${answerText}` : ''}`
    : `Question: ${question}\nMax marks: ${maxMarks}\nStudent answer:\n${answerText}`;

  let lastError;

  for (let attempt = 1; attempt <= MAX_EVALUATION_ATTEMPTS; attempt += 1) {
    try {
      const raw = await complete({
        stableSystem: ANSWER_EVALUATION_RUBRIC,
        dynamicSystemSuffix: `${respondInLanguageSuffix(language)} Max marks for this answer: ${maxMarks}.`,
        user: textBlock,
        content: buildMessageContent({ text: textBlock, imageBase64 }),
        tier: 'quality',
        feature: 'answer_evaluation',
        userId,
        maxTokens: 1500,
        json: true,
        timeoutMs: 90_000,
      });

      return validateAnswerEvaluation(raw, maxMarks);
    } catch (err) {
      lastError = err;

      if (err instanceof AppError) {
        throw err;
      }

      if (attempt === MAX_EVALUATION_ATTEMPTS) {
        break;
      }

      console.warn(`[answerEvaluator] Validation failed (attempt ${attempt}): ${err.message}`);
    }
  }

  throw new AppError(
    `Answer evaluation failed: ${lastError?.message ?? 'Invalid AI response'}`,
    502,
    'AI_RESPONSE_INVALID',
  );
}

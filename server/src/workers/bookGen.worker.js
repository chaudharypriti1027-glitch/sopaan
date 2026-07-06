import { z } from 'zod';
import { aiRuntimeConfig } from '../config/aiRuntimeConfig.js';
import { Book, BookGenJob, Chapter, Page } from '../models/index.js';
import { broadcastBookGenProgress } from '../realtime/bookGenBroadcast.js';
import { logger } from '../observability/logger.js';
import { complete } from '../services/ai/claudeClient.js';
import { stubBookChapterContent } from '../services/ai/e2eStubs.js';
import { htmlToPlainText } from '../utils/bookContent.js';
import { sanitizeBookHtml } from '../utils/sanitizeBookHtml.js';

const BOOK_GEN_SYSTEM_PROMPT =
  'You are an exam-prep author for Indian government exams. Write clear, accurate, exam-focused content for the chapter below. Output valid JSON only: { "summary": string, "pages": [{ "html": string }] }. Each page ≈ 400–600 words, use headings, worked examples with steps, and a short \'Key points\' list. No fluff, no markdown fences.';

const chapterOutputSchema = z.object({
  summary: z.string().trim().min(1),
  pages: z
    .array(
      z.object({
        html: z.string().trim().min(1),
      }),
    )
    .min(1),
});

function buildChapterUserPrompt({ spec, chapterTitle, chapterIndex, totalChapters }) {
  return [
    `Book title: ${spec.title}`,
    `Subject: ${spec.subject}`,
    `Audience: ${spec.audience}`,
    `Chapter ${chapterIndex + 1} of ${totalChapters}: ${chapterTitle}`,
    '',
    'Write exam-focused content for this chapter only.',
  ].join('\n');
}

function parseChapterJson(raw) {
  const parsed = chapterOutputSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.errors.map((issue) => issue.message).join(', ');
    throw new Error(`Invalid chapter JSON: ${message}`);
  }

  return parsed.data;
}

async function callChapterModel({
  spec,
  chapterTitle,
  chapterIndex,
  totalChapters,
  tier,
  userId,
  jobId: _jobId,
}) {
  if (aiRuntimeConfig.stubResponses) {
    return {
      chapter: stubBookChapterContent({
        chapterTitle,
        chapterIndex,
        totalChapters,
      }),
      usage: null,
    };
  }

  const { result, usage } = await complete({
    stableSystem: BOOK_GEN_SYSTEM_PROMPT,
    user: buildChapterUserPrompt({ spec, chapterTitle, chapterIndex, totalChapters }),
    tier,
    feature: 'book_generation',
    userId,
    maxTokens: 4000,
    temperature: 0.4,
    json: true,
    returnMeta: true,
    timeoutMs: 180_000,
  });

  return {
    chapter: parseChapterJson(result),
    usage,
  };
}

async function generateChapterWithFallback(params) {
  try {
    return await callChapterModel({ ...params, tier: 'quality' });
  } catch (firstError) {
    logger.warn('[bookGen] chapter generation failed, retrying with Haiku', {
      jobId: params.jobId,
      chapter: params.chapterTitle,
      message: firstError.message,
    });

    return callChapterModel({ ...params, tier: 'fast' });
  }
}

async function updateJobProgress(job, partial) {
  const updated = await BookGenJob.findByIdAndUpdate(
    job._id,
    { $set: partial },
    { new: true },
  ).lean();

  if (!updated) {
    return null;
  }

  broadcastBookGenProgress({
    jobId: updated._id.toString(),
    bookId: updated.bookId.toString(),
    state: updated.state,
    progress: updated.progress,
    error: updated.error ?? null,
    metrics: updated.metrics ?? null,
  });

  return updated;
}

function accumulateUsage(metrics, usage) {
  if (!usage) {
    return metrics;
  }

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;

  return {
    ...metrics,
    inputTokens: (metrics.inputTokens ?? 0) + inputTokens,
    outputTokens: (metrics.outputTokens ?? 0) + outputTokens,
  };
}

/**
 * Generate book chapters sequentially — one Claude call per chapter.
 * @param {{ jobId: string }} params
 */
export async function runBookGenJob({ jobId }) {
  const job = await BookGenJob.findById(jobId);

  if (!job) {
    throw new Error(`BookGenJob not found: ${jobId}`);
  }

  if (job.state === 'done' || job.state === 'running') {
    return { skipped: true, reason: `already_${job.state}` };
  }

  const book = await Book.findById(job.bookId);
  if (!book) {
    await updateJobProgress(job, {
      state: 'failed',
      error: 'Book not found',
      progress: job.progress,
    });
    throw new Error(`Book not found for job ${jobId}`);
  }

  const spec = job.spec ?? {};
  const chapters = Array.isArray(spec.chapters) ? spec.chapters : [];

  if (!chapters.length) {
    await updateJobProgress(job, {
      state: 'failed',
      error: 'No chapters in generation spec',
      progress: 0,
    });
    return { failed: true, reason: 'no_chapters' };
  }

  let metrics = {
    ...(job.metrics ?? {}),
    chaptersTotal: chapters.length,
    chaptersDone: job.metrics?.chaptersDone ?? 0,
    chaptersFailed: job.metrics?.chaptersFailed ?? 0,
    failedChapters: [...(job.metrics?.failedChapters ?? [])],
    inputTokens: job.metrics?.inputTokens ?? 0,
    outputTokens: job.metrics?.outputTokens ?? 0,
    estimatedCostUsd: job.metrics?.estimatedCostUsd ?? 0,
  };

  await updateJobProgress(job, {
    state: 'running',
    progress: Math.max(job.progress ?? 0, 1),
    metrics,
    error: undefined,
  });

  let globalPageOrder =
    (await Page.findOne({ bookId: book._id }).sort({ order: -1 }).select('order').lean())?.order ??
    0;

  const existingChapterCount =
    (await Chapter.countDocuments({ bookId: book._id })) ?? 0;

  for (let index = 0; index < chapters.length; index += 1) {
    const chapterTitle = chapters[index];
    const chapterOrder = existingChapterCount + index + 1;

    try {
      const { chapter: chapterOutput, usage } = await generateChapterWithFallback({
        spec,
        chapterTitle,
        chapterIndex: index,
        totalChapters: chapters.length,
        userId: job.requestedBy?.toString(),
        jobId: job._id.toString(),
      });

      metrics = accumulateUsage(metrics, usage);

      const chapter = await Chapter.create({
        bookId: book._id,
        order: chapterOrder,
        title: chapterTitle,
        summary: chapterOutput.summary,
      });

      for (const page of chapterOutput.pages) {
        const html = sanitizeBookHtml(page.html);
        if (!html) {
          continue;
        }

        globalPageOrder += 1;
        await Page.create({
          bookId: book._id,
          chapterId: chapter._id,
          order: globalPageOrder,
          html,
          plainText: htmlToPlainText(html),
        });
      }

      metrics = {
        ...metrics,
        chaptersDone: (metrics.chaptersDone ?? 0) + 1,
      };
    } catch (err) {
      metrics = {
        ...metrics,
        chaptersFailed: (metrics.chaptersFailed ?? 0) + 1,
        failedChapters: [
          ...(metrics.failedChapters ?? []),
          { title: chapterTitle, error: err.message?.slice(0, 500) ?? 'Generation failed' },
        ],
      };

      logger.error('[bookGen] chapter failed after retry', {
        jobId,
        chapter: chapterTitle,
        message: err.message,
      });
    }

    const progress = Math.round(((index + 1) / chapters.length) * 100);
    await updateJobProgress(job, {
      state: 'running',
      progress,
      metrics,
    });
  }

  await Book.findByIdAndUpdate(book._id, { pages: globalPageOrder });

  const allFailed = (metrics.chaptersDone ?? 0) === 0;
  const partialFailure = (metrics.chaptersFailed ?? 0) > 0;
  const finalState = allFailed ? 'failed' : 'done';
  const errorMessage = partialFailure
    ? `${metrics.chaptersFailed} chapter(s) failed`
    : allFailed
      ? 'All chapters failed to generate'
      : undefined;

  const finished = await updateJobProgress(job, {
    state: finalState,
    progress: finalState === 'done' ? 100 : job.progress,
    error: errorMessage,
    metrics,
  });

  logger.info('[bookGen] job finished', {
    jobId,
    bookId: book._id.toString(),
    state: finalState,
    chaptersDone: metrics.chaptersDone,
    chaptersFailed: metrics.chaptersFailed,
    inputTokens: metrics.inputTokens,
    outputTokens: metrics.outputTokens,
    estimatedCostUsd: metrics.estimatedCostUsd,
    feature: 'book_generation',
  });

  return {
    jobId,
    bookId: book._id.toString(),
    state: finished?.state ?? finalState,
    progress: finished?.progress ?? 100,
    pages: globalPageOrder,
    metrics,
  };
}

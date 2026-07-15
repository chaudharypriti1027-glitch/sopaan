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
  'You are an exam-prep author helping students crack any exam worldwide. Write clear, accurate, exam-focused content for the chapter below. Adapt to the exam/subject context when provided. Output valid JSON only: { "summary": string, "pages": [{ "html": string }] }. Each page ≈ 400–600 words, use headings, worked examples with steps, and a short \'Key points\' list. No fluff, no markdown fences.';

const chapterOutputSchema = z.object({
  summary: z.string().trim().min(1),
  pages: z
    .array(
      z.object({
        html: z.string().trim().min(1),
      })
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
    { new: true }
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

  if (job.state === 'done') {
    return { skipped: true, reason: 'already_done' };
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

  const existingChapters = await Chapter.find({ bookId: book._id }).select('title').lean();
  const completedTitles = new Set(existingChapters.map((chapter) => chapter.title));
  const priorFailures = (job.metrics?.failedChapters ?? []).filter(
    (failure) => !completedTitles.has(failure.title)
  );

  let metrics = {
    ...(job.metrics ?? {}),
    chaptersTotal: chapters.length,
    chaptersDone: chapters.filter((title) => completedTitles.has(title)).length,
    chaptersFailed: priorFailures.length,
    failedChapters: priorFailures,
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

  let nextChapterOrder = existingChapters.length;

  for (let index = 0; index < chapters.length; index += 1) {
    const chapterTitle = chapters[index];
    const progress = Math.round(((index + 1) / chapters.length) * 100);

    if (completedTitles.has(chapterTitle)) {
      await updateJobProgress(job, {
        state: 'running',
        progress,
        metrics,
      });
      continue;
    }

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

      const validPages = chapterOutput.pages
        .map((page) => sanitizeBookHtml(page.html))
        .filter(Boolean);
      if (!validPages.length) {
        throw new Error('Generated chapter did not contain safe page content');
      }

      const chapter = await Chapter.create({
        bookId: book._id,
        order: ++nextChapterOrder,
        title: chapterTitle,
        summary: chapterOutput.summary,
      });

      const pageDocs = validPages.map((html) => {
        globalPageOrder += 1;
        return {
          bookId: book._id,
          chapterId: chapter._id,
          order: globalPageOrder,
          html,
          plainText: htmlToPlainText(html),
        };
      });
      try {
        await Page.insertMany(pageDocs);
      } catch (pageError) {
        await Page.deleteMany({ chapterId: chapter._id });
        await Chapter.findByIdAndDelete(chapter._id);
        throw pageError;
      }

      completedTitles.add(chapterTitle);
      const failedChapters = (metrics.failedChapters ?? []).filter(
        (failure) => failure.title !== chapterTitle
      );
      metrics = {
        ...metrics,
        chaptersDone: chapters.filter((title) => completedTitles.has(title)).length,
        chaptersFailed: failedChapters.length,
        failedChapters,
      };
    } catch (err) {
      const failedChapters = [
        ...(metrics.failedChapters ?? []).filter((failure) => failure.title !== chapterTitle),
        { title: chapterTitle, error: err.code ?? 'GENERATION_FAILED' },
      ];
      metrics = {
        ...metrics,
        chaptersFailed: failedChapters.length,
        failedChapters,
      };

      logger.error('[bookGen] chapter failed after retry', {
        jobId,
        chapter: chapterTitle,
        message: err.message,
      });
    }

    await updateJobProgress(job, {
      state: 'running',
      progress,
      metrics,
    });
  }

  await Book.findByIdAndUpdate(book._id, { pages: globalPageOrder });

  const partialFailure = (metrics.chaptersFailed ?? 0) > 0;
  const finalState = partialFailure ? 'failed' : 'done';
  const errorMessage = partialFailure
    ? `${metrics.chaptersFailed} chapter(s) failed after model fallback`
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

  if (partialFailure) {
    throw new Error(errorMessage);
  }

  return {
    jobId,
    bookId: book._id.toString(),
    state: finished?.state ?? finalState,
    progress: finished?.progress ?? 100,
    pages: globalPageOrder,
    metrics,
  };
}

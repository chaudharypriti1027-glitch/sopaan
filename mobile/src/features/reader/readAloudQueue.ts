import type { ReaderFlatPage } from '../../hooks/useBookReader';

export type ReadAloudSentence = {
  id: string;
  text: string;
  pageOrder: number;
  line: number;
  chapterId: string;
  chapterTitle: string;
};

const BLOCK_TAG_PATTERN =
  /<(p|h1|h2|h3|h4|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;

function stripInlineHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse HTML blocks in the same order as ReaderPageContent line indices. */
export function parseHtmlBlocks(html: string): string[] {
  const blocks: string[] = [];
  const source = html || '';
  let match = BLOCK_TAG_PATTERN.exec(source);

  BLOCK_TAG_PATTERN.lastIndex = 0;
  while (match) {
    const text = stripInlineHtml(match[2] ?? '');
    if (text) {
      blocks.push(text);
    }
    match = BLOCK_TAG_PATTERN.exec(source);
  }

  if (blocks.length === 0) {
    const fallback = stripInlineHtml(source);
    if (fallback) {
      blocks.push(fallback);
    }
  }

  return blocks;
}

export function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const parts = trimmed.match(/[^.!?]+(?:[.!?]+|$)/g);
  if (!parts?.length) {
    return [trimmed];
  }

  return parts.map((part) => part.trim()).filter(Boolean);
}

export function buildReadAloudQueue(
  pages: ReaderFlatPage[],
  start: { pageOrder: number; line: number },
): ReadAloudSentence[] {
  const sentences: ReadAloudSentence[] = [];
  let started = false;

  for (const page of pages) {
    if (!started && page.order < start.pageOrder) {
      continue;
    }

    const blocks = parseHtmlBlocks(page.html);
    for (let line = 0; line < blocks.length; line += 1) {
      if (!started) {
        if (page.order < start.pageOrder) {
          continue;
        }
        if (page.order === start.pageOrder && line < start.line) {
          continue;
        }
        started = true;
      }

      const blockText = blocks[line] ?? '';
      const lineSentences = splitSentences(blockText);
      lineSentences.forEach((text, sentenceIndex) => {
        sentences.push({
          id: `${page.order}:${line}:${sentenceIndex}`,
          text,
          pageOrder: page.order,
          line,
          chapterId: page.chapterId,
          chapterTitle: page.chapterTitle,
        });
      });
    }
  }

  return sentences;
}

export function getChapterProgress(
  queue: ReadAloudSentence[],
  idx: number,
  chapterId: string | undefined,
) {
  if (!chapterId || queue.length === 0) {
    return { position: 0, total: 0, percent: 0 };
  }

  const chapterSentences = queue.filter((item) => item.chapterId === chapterId);
  const current = queue[idx];
  if (!current || current.chapterId !== chapterId) {
    return {
      position: 0,
      total: chapterSentences.length,
      percent: 0,
    };
  }

  const position = chapterSentences.findIndex((item) => item.id === current.id);
  const total = chapterSentences.length;
  const percent = total > 0 ? Math.round(((position + 1) / total) * 100) : 0;

  return { position: Math.max(0, position), total, percent };
}

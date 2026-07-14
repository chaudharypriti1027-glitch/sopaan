export type AiAnswerBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; items: string[] }
  | { type: 'formula'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'answer'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'explanation'; text?: string; bullets?: string[] };

const FORMULA_RE = /^[A-Za-z0-9πΣΔαβγθλμσφω%₹+\-*/^=().,\s·×÷]+$/;
const NUMBERED_RE = /^\d+[\).\]]\s+/;
const BULLET_RE = /^[-•*]\s+/;
const SECTION_START_RE = /^(answer|explanation|exam tip|key formula|solution|steps?)\s*:\s*(.*)$/i;
const INLINE_SECTION_RE = /^(answer|explanation|exam tip|key formula|solution|steps?)\s*:?\s*(.*)$/i;

type ParsedSection = { kind: string; body: string };

function cleanInlineMarkdown(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim();
}

function isFormulaLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  if (!/[=^×]/.test(trimmed) && !/^[A-Z]\s*=/.test(trimmed)) return false;
  return FORMULA_RE.test(trimmed);
}

function stripMarkers(line: string) {
  return line.replace(NUMBERED_RE, '').replace(BULLET_RE, '').trim();
}

function isBulletList(lines: string[]) {
  return lines.length > 0 && lines.every((line) => BULLET_RE.test(line) || NUMBERED_RE.test(line));
}

function splitStructuredSections(text: string): ParsedSection[] | null {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let current: { kind: string; bodyLines: string[] } | null = null;
  let hasSection = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed && !current) {
      continue;
    }

    const match = SECTION_START_RE.exec(trimmed);
    if (match) {
      hasSection = true;
      if (current) {
        sections.push({
          kind: current.kind,
          body: current.bodyLines.join('\n').trim(),
        });
      }

      const kind = match[1].toLowerCase();
      const inline = match[2]?.trim() ?? '';
      current = { kind, bodyLines: inline ? [inline] : [] };
      continue;
    }

    if (current) {
      current.bodyLines.push(rawLine.trimEnd());
    }
  }

  if (current) {
    sections.push({
      kind: current.kind,
      body: current.bodyLines.join('\n').trim(),
    });
  }

  return hasSection ? sections : null;
}

function sectionToBlocks(kind: string, body: string): AiAnswerBlock[] {
  if (kind.startsWith('answer')) {
    return body ? [{ type: 'answer', text: cleanInlineMarkdown(body) }] : [];
  }

  if (kind.startsWith('exam tip')) {
    return body ? [{ type: 'tip', text: cleanInlineMarkdown(body) }] : [];
  }

  if (kind.includes('formula')) {
    return body ? [{ type: 'formula', text: cleanInlineMarkdown(body) }] : [];
  }

  if (kind.startsWith('explanation') || kind.startsWith('solution') || kind.startsWith('step')) {
    if (!body) {
      return [];
    }

    const lines = body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (isBulletList(lines)) {
      return [
        {
          type: 'explanation',
          bullets: lines.map((line) => cleanInlineMarkdown(stripMarkers(line))),
        },
      ];
    }

    if (lines.length === 1 && isFormulaLine(lines[0])) {
      return [{ type: 'formula', text: cleanInlineMarkdown(lines[0]) }];
    }

    return [{ type: 'explanation', text: cleanInlineMarkdown(body) }];
  }

  return body ? [{ type: 'paragraph', text: cleanInlineMarkdown(body) }] : [];
}

function dedupeBlocks(blocks: AiAnswerBlock[]): AiAnswerBlock[] {
  const answerText = blocks.find((block) => block.type === 'answer')?.text?.trim();

  return blocks.filter((block) => {
    if (!answerText || block.type !== 'explanation') {
      return true;
    }

    if (block.text?.trim() === answerText) {
      return false;
    }

    if (block.bullets?.length === 1 && block.bullets[0].trim() === answerText) {
      return false;
    }

    return true;
  });
}

function parseSectionLine(line: string): AiAnswerBlock | null {
  const cleaned = cleanInlineMarkdown(line);
  const match = INLINE_SECTION_RE.exec(cleaned);
  if (!match) {
    return null;
  }

  const label = match[1].toLowerCase();
  const body = match[2]?.trim() ?? '';

  if (label.startsWith('answer')) {
    return body ? { type: 'answer', text: body } : null;
  }

  if (label.startsWith('exam tip')) {
    return body ? { type: 'tip', text: body } : null;
  }

  return body ? { type: 'heading', text: label.toUpperCase() } : { type: 'heading', text: label.toUpperCase() };
}

function parseLegacyBlocks(text: string): AiAnswerBlock[] {
  const blocks: AiAnswerBlock[] = [];
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    const lines = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 1) {
      const section = parseSectionLine(lines[0]);
      if (section) {
        blocks.push(section);
        continue;
      }
    }

    if (isBulletList(lines)) {
      blocks.push({
        type: 'bullet',
        items: lines.map((line) => cleanInlineMarkdown(stripMarkers(line))),
      });
      continue;
    }

    if (lines.length === 1 && isFormulaLine(lines[0])) {
      blocks.push({ type: 'formula', text: cleanInlineMarkdown(lines[0]) });
      continue;
    }

    if (
      lines.length === 1 &&
      lines[0].length < 72 &&
      lines[0] === lines[0].toUpperCase() &&
      !lines[0].includes('.') &&
      !lines[0].includes('=')
    ) {
      blocks.push({ type: 'heading', text: cleanInlineMarkdown(lines[0]) });
      continue;
    }

    blocks.push({ type: 'paragraph', text: cleanInlineMarkdown(paragraph) });
  }

  return blocks;
}

export function parseAiAnswer(text: string): AiAnswerBlock[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [{ type: 'paragraph', text: '' }];
  }

  const sections = splitStructuredSections(trimmed);
  if (sections?.length) {
    const blocks = dedupeBlocks(sections.flatMap((section) => sectionToBlocks(section.kind, section.body)));
    if (blocks.length) {
      return blocks;
    }
  }

  const legacy = parseLegacyBlocks(trimmed);
  return legacy.length ? legacy : [{ type: 'paragraph', text: cleanInlineMarkdown(trimmed) }];
}

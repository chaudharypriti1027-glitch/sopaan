export type AiAnswerBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; items: string[] }
  | { type: 'formula'; text: string }
  | { type: 'heading'; text: string };

const FORMULA_RE = /^[A-Za-z0-9πΣΔαβγθλμσφω%₹+\-*/^=().,\s·×÷]+$/;
const NUMBERED_RE = /^\d+[\).\]]\s+/;
const BULLET_RE = /^[-•*]\s+/;

function isFormulaLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  if (!/[=^×]/.test(trimmed) && !/^[A-Z]\s*=/.test(trimmed)) return false;
  return FORMULA_RE.test(trimmed);
}

function stripMarkers(line: string) {
  return line.replace(NUMBERED_RE, '').replace(BULLET_RE, '').trim();
}

export function parseAiAnswer(text: string): AiAnswerBlock[] {
  const blocks: AiAnswerBlock[] = [];
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean);

    if (lines.length > 1 && lines.every((line) => BULLET_RE.test(line) || NUMBERED_RE.test(line))) {
      blocks.push({
        type: 'bullet',
        items: lines.map(stripMarkers),
      });
      continue;
    }

    if (lines.length === 1 && isFormulaLine(lines[0])) {
      blocks.push({ type: 'formula', text: lines[0] });
      continue;
    }

    if (lines.length === 1 && lines[0].length < 72 && lines[0] === lines[0].toUpperCase() && !lines[0].includes('.')) {
      blocks.push({ type: 'heading', text: lines[0] });
      continue;
    }

    blocks.push({ type: 'paragraph', text: paragraph });
  }

  return blocks.length ? blocks : [{ type: 'paragraph', text }];
}

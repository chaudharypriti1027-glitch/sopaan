import type { SubmitTestResponse } from '../api/types';

type ResultReportInput = {
  testTitle: string;
  subject?: string;
  topic?: string;
  examTag?: string;
  attempt: SubmitTestResponse['attempt'];
  answers: SubmitTestResponse['answers'];
  coaching?: SubmitTestResponse['coaching'];
  generatedAt?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatExplanation(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

export function buildResultReportHtml({
  testTitle,
  subject,
  topic,
  examTag,
  attempt,
  answers,
  coaching,
  generatedAt = new Date().toISOString(),
}: ResultReportInput) {
  const correct = answers.filter((item) => item.correct).length;
  const total = answers.length;

  const questionBlocks = answers
    .map((item, index) => {
      const options = item.question?.options ?? [];
      const correctKey = item.question?.correctKey ?? '';
      const selectedKey = item.selectedKey ?? '—';
      const status = item.correct ? 'Correct' : item.selectedKey ? 'Wrong' : 'Skipped';

      const optionsHtml = options
        .map((opt) => {
          const markers = [
            opt.key === correctKey ? '✓ correct' : '',
            opt.key === selectedKey ? 'your pick' : '',
          ]
            .filter(Boolean)
            .join(', ');
          return `<li><strong>${escapeHtml(opt.key)}.</strong> ${escapeHtml(opt.text)}${
            markers ? ` <em>(${escapeHtml(markers)})</em>` : ''
          }</li>`;
        })
        .join('');

      const explanation = item.question?.explanation
        ? `<div class="explanation"><strong>Solution</strong><br/>${formatExplanation(item.question.explanation)}</div>`
        : '';

      return `
        <section class="question">
          <h3>Q${index + 1}. ${escapeHtml(item.question?.text ?? 'Question')}</h3>
          <p class="meta">Status: ${status} · Topic: ${escapeHtml(item.question?.topic ?? item.question?.subject ?? 'General')}</p>
          <ul>${optionsHtml}</ul>
          ${explanation}
        </section>
      `;
    })
    .join('');

  const weakTopics = coaching?.weakTopics?.length
    ? `<p><strong>Weak topics:</strong> ${escapeHtml(coaching.weakTopics.join(', '))}</p>`
    : '';

  const coachBlock = coaching?.feedback
    ? `<section class="coach"><h2>AI coach</h2><p>${escapeHtml(coaching.feedback)}</p>${weakTopics}</section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(testTitle)} — Sopaan Result</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1c1e2e; padding: 24px; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .sub { color: #5c5e6e; margin-bottom: 18px; }
    .score { background: #f4f1e9; border: 1px solid #e9ebf3; border-radius: 12px; padding: 14px; margin-bottom: 20px; }
    .question { border-top: 1px solid #e9ebf3; padding-top: 16px; margin-top: 16px; }
    .meta { color: #6b6d7e; font-size: 13px; }
    .explanation { background: #fafbfd; border-left: 3px solid #c29a4e; padding: 10px 12px; margin-top: 10px; border-radius: 8px; }
    .coach { background: #f8faff; border-radius: 12px; padding: 14px; margin: 20px 0; }
    ul { padding-left: 18px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(testTitle)}</h1>
  <p class="sub">${escapeHtml([subject, topic, examTag].filter(Boolean).join(' · '))}</p>
  <div class="score">
    <p><strong>Score:</strong> ${attempt.score}/${total} · <strong>Accuracy:</strong> ${attempt.accuracy}%</p>
    <p><strong>Correct:</strong> ${correct}/${total} · <strong>Time:</strong> ${Math.floor((attempt.totalTimeSec ?? 0) / 60)} min</p>
    <p><strong>Generated:</strong> ${escapeHtml(new Date(generatedAt).toLocaleString())}</p>
  </div>
  ${coachBlock}
  <h2>Questions & solutions</h2>
  ${questionBlocks}
</body>
</html>`;
}

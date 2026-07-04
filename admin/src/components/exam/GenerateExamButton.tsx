import { useExamGenerate } from '../../exam/ExamGenerateContext';

export function GenerateExamButton({ label = 'Generate exam · AI' }: { label?: string }) {
  const { generating, generateFullExam } = useExamGenerate();

  return (
    <button
      type="button"
      className="tbtn gold"
      disabled={generating}
      onClick={() => generateFullExam()}
    >
      <svg className="svg" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
      </svg>
      {generating ? 'Generating…' : label}
    </button>
  );
}

import { Sparkles } from 'lucide-react';
import { useExamGenerate } from '../../exam/ExamGenerateContext';

export function GenerateExamButton({ label = 'Generate exam · AI' }: { label?: string }) {
  const { generating, generateFullExam } = useExamGenerate();

  return (
    <button
      type="button"
      className="tbtn gold generate-exam-button"
      disabled={generating}
      onClick={() => generateFullExam()}
    >
      <Sparkles aria-hidden strokeWidth={1.8} />
      {generating ? 'Generating…' : label}
    </button>
  );
}

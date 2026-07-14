import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  listAiFeedback,
  reviewAiFeedback,
  type AiFeedbackItem,
} from '../api/aiFeedback';
import { DataTable } from '../components/DataTable';
import { useToast } from '../components/Toast';
import './aiFeedback.css';

function truncate(value: string | null | undefined, max = 72) {
  if (!value) return '—';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function reasonLabel(reason: string) {
  switch (reason) {
    case 'inaccurate':
      return 'Inaccurate';
    case 'off_topic':
      return 'Off topic';
    case 'unsafe':
      return 'Unsafe';
    default:
      return 'Flagged';
  }
}

export function AiFeedbackPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideGrade, setOverrideGrade] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  const feedbackQuery = useQuery({
    queryKey: ['admin', 'ai-feedback'],
    queryFn: () => listAiFeedback({ status: 'pending', feature: 'answer_evaluation' }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      grade,
      note,
    }: {
      id: string;
      action: 'keep' | 'override';
      grade?: number;
      note?: string;
    }) => reviewAiFeedback(id, { action, grade, note }),
    onSuccess: (_row, vars) => {
      showToast(vars.action === 'keep' ? 'AI grade kept' : 'Grade overridden');
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setOverrideId(null);
      setOverrideGrade('');
      setOverrideNote('');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = feedbackQuery.data?.items ?? [];
  const editing = rows.find((row) => row.id === overrideId) ?? null;

  function submitOverride() {
    if (!editing) return;
    const grade = Number(overrideGrade);
    if (!Number.isFinite(grade)) {
      showToast('Enter a valid grade');
      return;
    }
    reviewMutation.mutate({
      id: editing.id,
      action: 'override',
      grade,
      note: overrideNote.trim() || undefined,
    });
  }

  return (
    <div className="ai-feedback-page">
      <p className="ai-feedback-note">
        Student answers flagged by the AI evaluator. Keep the AI grade or override it — overrides
        update the stored result and notify the student.
      </p>

      <DataTable<AiFeedbackItem>
        rows={rows}
        emptyMessage="No flagged AI feedback"
        isLoading={feedbackQuery.isLoading}
        error={feedbackQuery.isError ? feedbackQuery.error : undefined}
        onRetry={() => void feedbackQuery.refetch()}
        columns={[
          {
            key: 'question',
            header: 'Question',
            render: (row) => truncate(row.questionText ?? row.inputSummary),
          },
          {
            key: 'student',
            header: 'Student',
            render: (row) => row.student.name,
          },
          {
            key: 'grade',
            header: 'AI grade',
            render: (row) =>
              row.aiGrade != null ? `${row.aiGrade} / ${row.maxMarks}` : '—',
          },
          {
            key: 'flag',
            header: 'Flag',
            render: (row) => (
              <span className="pill p-rev">{reasonLabel(row.reason)}</span>
            ),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
              <div className="act">
                <button
                  type="button"
                  className="abtn pri"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({ id: row.id, action: 'keep' })
                  }
                >
                  Keep grade
                </button>
                <button
                  type="button"
                  className="abtn no"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    setOverrideId(row.id);
                    setOverrideGrade(
                      row.aiGrade != null ? String(row.aiGrade) : '',
                    );
                    setOverrideNote('');
                  }}
                >
                  Override
                </button>
              </div>
            ),
          },
        ]}
      />

      {editing ? (
        <div className="panel ai-feedback-override">
          <div className="ph">
            <h3>Override grade for {editing.student.name}</h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <p className="ai-feedback-note">
              Current AI grade: {editing.aiGrade ?? '—'} / {editing.maxMarks}
            </p>
            <label className="form-field" htmlFor="override-grade">
              <span className="form-label">New grade (0–{editing.maxMarks})</span>
              <input
                id="override-grade"
                className="form-input"
                type="number"
                min={0}
                max={editing.maxMarks}
                value={overrideGrade}
                onChange={(event) => setOverrideGrade(event.target.value)}
              />
            </label>
            <label className="form-field" htmlFor="override-note">
              <span className="form-label">Note to student (optional)</span>
              <textarea
                id="override-note"
                className="form-input form-textarea"
                rows={3}
                value={overrideNote}
                onChange={(event) => setOverrideNote(event.target.value)}
              />
            </label>
            <div className="ai-feedback-actions">
              <button
                type="button"
                className="tbtn ghost"
                onClick={() => setOverrideId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tbtn gold"
                disabled={reviewMutation.isPending}
                onClick={submitOverride}
              >
                {reviewMutation.isPending ? 'Saving…' : 'Apply override'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

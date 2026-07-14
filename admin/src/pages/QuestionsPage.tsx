import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ApiError } from '../api/types';
import {
  deleteQuestion,
  fetchQuestions,
  importQuestionsJson,
  setQuestionStatus,
} from '../api/questions';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { ImportSummary } from '../components/questions/ImportSummary';
import { PaginationBar } from '../components/questions/PaginationBar';
import { QuestionStatusPill } from '../components/questions/QuestionStatusPill';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';
import type { QuestionImportResult } from '../api/questionTypes';
import { truncateText } from '../utils/questionFormat';

const PAGE_SIZE = 20;

export function QuestionsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [offset, setOffset] = useState(0);
  const [importResult, setImportResult] = useState<QuestionImportResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'questions', { search, statusFilter, offset }],
    queryFn: () =>
      fetchQuestions({
        q: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' }) =>
      setQuestionStatus(id, status),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (_data, vars) => {
      showToast(vars.status === 'published' ? 'Published' : 'Unpublished');
      invalidate();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.code === 'QUALITY_GATE_FAILED') {
        showToast(err.message);
        return;
      }
      showToast(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      showToast('Deleted');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const importMutation = useMutation({
    mutationFn: importQuestionsJson,
    onSuccess: (result) => {
      setImportResult(result);
      showToast(`Imported ${result.insertedCount} · ${result.errorCount} failed`);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  async function handleImportFile(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text) as { questions?: unknown[] } | unknown[];
    const questions = Array.isArray(payload) ? payload : payload.questions;
    if (!Array.isArray(questions) || !questions.length) {
      showToast('JSON must contain a non-empty questions array');
      return;
    }
    importMutation.mutate(questions);
  }

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setOffset(0);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <ActionButton
          variant="gold"
          onClick={() => fileRef.current?.click()}
          disabled={importMutation.isPending}
        >
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
          </svg>
          Import questions
        </ActionButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {importResult ? <ImportSummary result={importResult} /> : null}

      <DataTable
        rows={rows}
        emptyMessage="No questions found"
        isLoading={query.isLoading}
        error={query.isError ? query.error : undefined}
        onRetry={() => void query.refetch()}
        columns={[
          {
            key: 'text',
            header: 'Question',
            render: (row) => truncateText(row.text),
          },
          { key: 'subject', header: 'Subject', render: (row) => row.subject },
          {
            key: 'difficulty',
            header: 'Difficulty',
            render: (row) => row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <QuestionStatusPill question={row} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                {row.status === 'published' ? (
                  <TableActionButton
                    disabled={busyId === row.id}
                    onClick={() => statusMutation.mutate({ id: row.id, status: 'draft' })}
                  >
                    Unpublish
                  </TableActionButton>
                ) : (
                  <TableActionButton
                    variant="primary"
                    disabled={busyId === row.id}
                    onClick={() => statusMutation.mutate({ id: row.id, status: 'published' })}
                  >
                    Publish
                  </TableActionButton>
                )}
                <TableActionButton
                  variant="danger"
                  disabled={busyId === row.id}
                  onClick={() => deleteMutation.mutate(row.id)}
                >
                  Delete
                </TableActionButton>
              </div>
            ),
          },
        ]}
      />

      {pagination ? (
        <PaginationBar
          offset={pagination.offset}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={setOffset}
        />
      ) : null}
    </div>
  );
}

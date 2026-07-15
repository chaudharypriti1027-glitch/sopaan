import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { AdminCurrentAffair } from '../api/contentTypes';
import {
  createCurrentAffair,
  deleteCurrentAffair,
  fetchCurrentAffairs,
  generateCurrentAffairAi,
  setCurrentAffairStatus,
  updateCurrentAffair,
  type CurrentAffairInput,
} from '../api/currentAffairs';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { FormField } from '../components/content/FormField';
import { CoverImageField } from '../components/media/MediaPicker';
import { PublishStatusPill } from '../components/content/PublishStatusPill';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';
import { usePublishableResource } from '../hooks/usePublishableResource';

type FormState = {
  title: string;
  summary: string;
  body: string;
  category: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  imageColor: string;
  imageUrl: string;
};

const emptyForm = (): FormState => ({
  title: '',
  summary: '',
  body: '',
  category: 'General',
  source: '',
  sourceUrl: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  imageColor: '',
  imageUrl: '',
});

function toForm(row: AdminCurrentAffair): FormState {
  const publishedAt = row.publishedAt ? new Date(row.publishedAt).toISOString().slice(0, 10) : '';
  return {
    title: row.title,
    summary: row.summary ?? '',
    body: row.body ?? '',
    category: row.category ?? 'General',
    source: row.source ?? '',
    sourceUrl: row.sourceUrl ?? '',
    publishedAt,
    imageColor: row.imageColor ?? '',
    imageUrl: row.imageUrl ?? '',
  };
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim()) errors.title = 'Headline is required';
  if (!form.publishedAt) errors.publishedAt = 'Published date is required';
  return errors;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function CurrentAffairsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const resource = usePublishableResource<AdminCurrentAffair, CurrentAffairInput>({
    queryKey: ['admin', 'current-affairs'] as const,
    list: fetchCurrentAffairs,
    create: createCurrentAffair,
    update: updateCurrentAffair,
    setStatus: setCurrentAffairStatus,
    remove: deleteCurrentAffair,
    deleteConfirmLabel: (row) => `Delete article "${row.title}"?`,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCurrentAffair | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);

  const aiMutation = useMutation({
    mutationFn: generateCurrentAffairAi,
    onMutate: (id) => setAiBusyId(id),
    onSettled: () => setAiBusyId(null),
    onSuccess: (updated) => {
      showToast('AI summary and quiz generated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'current-affairs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      if (editing?.id === updated.id) {
        setEditing(updated);
        setForm(toForm(updated));
      }
    },
    onError: (err: Error) => showToast(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(row: AdminCurrentAffair) {
    setEditing(row);
    setForm(toForm(row));
    setErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (resource.saveMutation.isPending || aiMutation.isPending) return;
    setDrawerOpen(false);
    setEditing(null);
  }

  async function handleSave() {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body: CurrentAffairInput = {
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      body: form.body.trim() || undefined,
      category: form.category.trim() || undefined,
      source: form.source.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      publishedAt: new Date(form.publishedAt).toISOString(),
      imageColor: form.imageColor.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      status: editing?.status ?? 'draft',
    };

    const saved = await resource.saveMutation.mutateAsync({ id: editing?.id, body });
    if (!editing) {
      setEditing(saved);
    }
    closeDrawer();
  }

  function handleAi(id: string) {
    if (
      !window.confirm(
        'Generate an exam-angle summary and 3 quiz questions with AI? This replaces the current summary and quiz.'
      )
    ) {
      return;
    }
    aiMutation.mutate(id);
  }

  return (
    <div className="content-page current-affairs-page">
      <div className="toolbar">
        <div className="search toolbar-search">
          <Search aria-hidden strokeWidth={1.8} />
          <input
            placeholder="Search articles…"
            aria-label="Search current affairs"
            value={resource.search}
            onChange={(e) => resource.setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={resource.statusFilter}
          onChange={(e) => resource.setStatusFilter(e.target.value as typeof resource.statusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <ActionButton variant="gold" onClick={openCreate}>
          <Plus aria-hidden strokeWidth={1.8} />
          Add article
        </ActionButton>
      </div>

      <DataTable
        rows={resource.rows}
        emptyMessage="No articles found"
        emptyHint="Adjust the filters or add a current-affairs article."
        isLoading={resource.query.isLoading}
        error={resource.query.isError ? resource.query.error : undefined}
        onRetry={() => void resource.query.refetch()}
        columns={[
          { key: 'title', header: 'Headline', render: (row) => row.title },
          { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
          {
            key: 'publishedAt',
            header: 'Published',
            render: (row) => formatDate(row.publishedAt),
          },
          {
            key: 'quiz',
            header: 'Quiz',
            render: (row) => `${row.quizQuestions?.length ?? 0} Q`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <PublishStatusPill status={row.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                <TableActionButton onClick={() => openEdit(row)}>Edit</TableActionButton>
                <TableActionButton
                  variant="ok"
                  disabled={aiBusyId === row.id}
                  onClick={() => handleAi(row.id)}
                >
                  {aiBusyId === row.id ? 'Generating…' : 'Auto-summary + quiz (AI)'}
                </TableActionButton>
                {row.status === 'published' ? (
                  <TableActionButton
                    disabled={resource.busyId === row.id}
                    onClick={() => resource.statusMutation.mutate({ id: row.id, status: 'draft' })}
                  >
                    Unpublish
                  </TableActionButton>
                ) : (
                  <TableActionButton
                    variant="primary"
                    disabled={resource.busyId === row.id}
                    onClick={() =>
                      resource.statusMutation.mutate({ id: row.id, status: 'published' })
                    }
                  >
                    Publish
                  </TableActionButton>
                )}
                <TableActionButton
                  variant="danger"
                  disabled={resource.busyId === row.id}
                  onClick={() => resource.handleDelete(row)}
                >
                  Delete
                </TableActionButton>
              </div>
            ),
          },
        ]}
      />

      {resource.pagination ? (
        <PaginationBar
          offset={resource.pagination.offset}
          limit={resource.pagination.limit}
          total={resource.pagination.total}
          onPageChange={resource.setOffset}
        />
      ) : null}

      <Drawer
        open={drawerOpen}
        title={editing ? 'Edit article' : 'Add article'}
        onClose={closeDrawer}
        onSubmit={() => void handleSave()}
        submitting={resource.saveMutation.isPending}
        submitLabel={editing ? 'Save changes' : 'Create article'}
        footerExtra={
          editing ? (
            <ActionButton
              variant="navy"
              onClick={() => handleAi(editing.id)}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? 'Generating…' : 'Auto-summary + quiz (AI)'}
            </ActionButton>
          ) : null
        }
      >
        <div className="drawer-form">
          <FormField id="affair-title" label="Headline" error={errors.title}>
            <input
              id="affair-title"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="New scheme announced"
            />
          </FormField>
          <FormField id="affair-summary" label="Short summary">
            <textarea
              id="affair-summary"
              className="form-input form-textarea"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              rows={3}
              placeholder="One-line exam-angle summary for cards"
            />
          </FormField>
          <FormField id="affair-body" label="Full article">
            <textarea
              id="affair-body"
              className="form-input form-textarea"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={8}
              placeholder="Full notes for students (or use AI after saving)"
            />
          </FormField>
          <FormField id="affair-category" label="Category">
            <input
              id="affair-category"
              className="form-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Schemes"
            />
          </FormField>
          <FormField id="affair-source" label="Source">
            <input
              id="affair-source"
              className="form-input"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="PIB, The Hindu, etc."
            />
          </FormField>
          <FormField id="affair-source-url" label="Source URL">
            <input
              id="affair-source-url"
              type="url"
              className="form-input"
              value={form.sourceUrl}
              onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
              placeholder="https://pib.gov.in/..."
            />
          </FormField>
          <FormField id="affair-date" label="Published date" error={errors.publishedAt}>
            <input
              id="affair-date"
              type="date"
              className="form-input"
              value={form.publishedAt}
              onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
            />
          </FormField>
          <FormField id="affair-color" label="Image color">
            <input
              id="affair-color"
              className="form-input"
              value={form.imageColor}
              onChange={(e) => setForm((f) => ({ ...f, imageColor: e.target.value }))}
              placeholder="#3B82F6"
            />
          </FormField>
          <CoverImageField
            label="Cover image"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />
          {editing && editing.quizQuestions?.length ? (
            <p className="form-hint">
              {editing.quizQuestions.length} quiz question
              {editing.quizQuestions.length === 1 ? '' : 's'} linked
            </p>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}

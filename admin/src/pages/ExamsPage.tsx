import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  createExam,
  deleteExam,
  fetchExams,
  setExamStatus,
  updateExam,
  type ExamInput,
} from '../api/exams';
import type { AdminExam } from '../api/contentTypes';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { FormField } from '../components/content/FormField';
import { PublishStatusPill } from '../components/content/PublishStatusPill';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { usePublishableResource } from '../hooks/usePublishableResource';

const EXAM_CATEGORIES = [
  'SSC',
  'Banking',
  'Railways',
  'UPSC',
  'StatePSC',
  'Police',
  'Defence',
  'Teaching',
  'Other',
] as const;

type FormState = {
  name: string;
  code: string;
  category: string;
  description: string;
};

const emptyForm = (): FormState => ({
  name: '',
  code: '',
  category: 'SSC',
  description: '',
});

function toForm(row: AdminExam): FormState {
  return {
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description ?? '',
  };
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.code.trim()) errors.code = 'Code is required';
  if (!form.category) errors.category = 'Category is required';
  return errors;
}

export function ExamsPage() {
  const resource = usePublishableResource<AdminExam, ExamInput>({
    queryKey: ['admin', 'exams'] as const,
    list: fetchExams,
    create: createExam,
    update: updateExam,
    setStatus: setExamStatus,
    remove: deleteExam,
    deleteConfirmLabel: (row) => `Delete exam "${row.name}"?`,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminExam | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(row: AdminExam) {
    setEditing(row);
    setForm(toForm(row));
    setErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (resource.saveMutation.isPending) return;
    setDrawerOpen(false);
    setEditing(null);
  }

  async function handleSave() {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body: ExamInput = {
      name: form.name.trim(),
      code: form.code.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      status: editing?.status ?? 'draft',
    };

    await resource.saveMutation.mutateAsync({ id: editing?.id, body });
    closeDrawer();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <Search aria-hidden strokeWidth={1.8} />
          <input
            placeholder="Search exams…"
            aria-label="Search exams"
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
          Add exam
        </ActionButton>
      </div>

      <DataTable
        rows={resource.rows}
        emptyMessage="No exams found"
        isLoading={resource.query.isLoading}
        error={resource.query.isError ? resource.query.error : undefined}
        onRetry={() => void resource.query.refetch()}
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.name },
          { key: 'code', header: 'Code', render: (row) => row.code },
          { key: 'category', header: 'Category', render: (row) => row.category },
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
        title={editing ? 'Edit exam' : 'Add exam'}
        onClose={closeDrawer}
        onSubmit={() => void handleSave()}
        submitting={resource.saveMutation.isPending}
        submitLabel={editing ? 'Save changes' : 'Create exam'}
      >
        <div className="drawer-form">
          <FormField id="exam-name" label="Exam name" error={errors.name}>
            <input
              id="exam-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="SSC CGL"
            />
          </FormField>
          <FormField id="exam-code" label="Exam code" error={errors.code}>
            <input
              id="exam-code"
              className="form-input"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="SSC-CGL"
            />
          </FormField>
          <FormField id="exam-category" label="Category" error={errors.category}>
            <select
              id="exam-category"
              className="form-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {EXAM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="exam-description" label="Description">
            <textarea
              id="exam-description"
              className="form-input form-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Optional overview for aspirants"
            />
          </FormField>
        </div>
      </Drawer>
    </div>
  );
}

import { useState } from 'react';
import type { AdminCourse } from '../api/contentTypes';
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  setCourseStatus,
  updateCourse,
  type CourseInput,
} from '../api/courses';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { FormField } from '../components/content/FormField';
import { PublishStatusPill } from '../components/content/PublishStatusPill';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { CoverImageField } from '../components/media/MediaPicker';
import { usePublishableResource } from '../hooks/usePublishableResource';

type FormState = {
  title: string;
  subject: string;
  examTags: string;
  isFree: boolean;
  thumbnailColor: string;
  thumbnailUrl: string;
};

const emptyForm = (): FormState => ({
  title: '',
  subject: 'General',
  examTags: '',
  isFree: true,
  thumbnailColor: '',
  thumbnailUrl: '',
});

function toForm(row: AdminCourse): FormState {
  return {
    title: row.title,
    subject: row.subject,
    examTags: (row.examTags ?? []).join(', '),
    isFree: row.isFree ?? true,
    thumbnailColor: row.thumbnailColor ?? '',
    thumbnailUrl: row.thumbnailUrl ?? '',
  };
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.subject.trim()) errors.subject = 'Subject is required';
  return errors;
}

function parseExamTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CoursesPage() {
  const resource = usePublishableResource<AdminCourse, CourseInput>({
    queryKey: ['admin', 'courses'] as const,
    list: fetchCourses,
    create: createCourse,
    update: updateCourse,
    setStatus: setCourseStatus,
    remove: deleteCourse,
    deleteConfirmLabel: (row) => `Delete course "${row.title}"?`,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(row: AdminCourse) {
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

    const body: CourseInput = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      examTags: parseExamTags(form.examTags),
      isFree: form.isFree,
      thumbnailColor: form.thumbnailColor.trim() || undefined,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      status: editing?.status ?? 'draft',
    };

    await resource.saveMutation.mutateAsync({ id: editing?.id, body });
    closeDrawer();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search courses…"
            value={resource.search}
            onChange={(e) => resource.setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={resource.statusFilter}
          onChange={(e) =>
            resource.setStatusFilter(e.target.value as typeof resource.statusFilter)
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <ActionButton variant="gold" onClick={openCreate}>
          Add course
        </ActionButton>
      </div>

      <DataTable
        rows={resource.rows}
        emptyMessage={resource.query.isLoading ? 'Loading courses…' : 'No courses found'}
        columns={[
          { key: 'title', header: 'Title', render: (row) => row.title },
          { key: 'subject', header: 'Subject', render: (row) => row.subject },
          {
            key: 'free',
            header: 'Access',
            render: (row) => (row.isFree ? 'Free' : 'Paid'),
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
                {row.status === 'published' ? (
                  <TableActionButton
                    disabled={resource.busyId === row.id}
                    onClick={() =>
                      resource.statusMutation.mutate({ id: row.id, status: 'draft' })
                    }
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
        title={editing ? 'Edit course' : 'Add course'}
        onClose={closeDrawer}
        onSubmit={() => void handleSave()}
        submitting={resource.saveMutation.isPending}
        submitLabel={editing ? 'Save changes' : 'Create course'}
      >
        <div className="drawer-form">
          <FormField id="course-title" label="Course title" error={errors.title}>
            <input
              id="course-title"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Quant Foundation"
            />
          </FormField>
          <FormField id="course-subject" label="Subject" error={errors.subject}>
            <input
              id="course-subject"
              className="form-input"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Quant"
            />
          </FormField>
          <FormField id="course-tags" label="Exam tags (comma-separated)">
            <input
              id="course-tags"
              className="form-input"
              value={form.examTags}
              onChange={(e) => setForm((f) => ({ ...f, examTags: e.target.value }))}
              placeholder="SSC, Banking"
            />
          </FormField>
          <FormField id="course-color" label="Thumbnail color (fallback)">
            <input
              id="course-color"
              className="form-input"
              value={form.thumbnailColor}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailColor: e.target.value }))}
              placeholder="#3B82F6"
            />
          </FormField>
          <CoverImageField
            label="Cover image"
            value={form.thumbnailUrl}
            onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
          />
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
            />
            <span>Free course</span>
          </label>
        </div>
      </Drawer>
    </div>
  );
}

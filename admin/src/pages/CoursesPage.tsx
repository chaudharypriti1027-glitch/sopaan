import { useState } from 'react';
import type { AdminCourse } from '../api/contentTypes';
import {
  createCourse,
  deleteCourse,
  fetchCourse,
  fetchCourses,
  setCourseStatus,
  updateCourse,
  type CourseInput,
} from '../api/courses';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { FormField } from '../components/content/FormField';
import {
  LessonEditor,
  lessonsFromCourse,
  lessonsToPayload,
  type LessonFormState,
} from '../components/courses/LessonEditor';
import { PublishStatusPill } from '../components/content/PublishStatusPill';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { CoverImageField } from '../components/media/MediaPicker';
import { useToast } from '../components/Toast';
import { usePublishableResource } from '../hooks/usePublishableResource';
import '../components/courses/courses.css';

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

function validateForm(
  form: FormState,
  lessons: LessonFormState[],
): Partial<Record<keyof FormState, string>> & { lessons?: string } {
  const errors: Partial<Record<keyof FormState, string>> & { lessons?: string } = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.subject.trim()) errors.subject = 'Subject is required';

  const titledLessons = lessons.filter((lesson) => lesson.title.trim());
  if (titledLessons.length === 0) {
    errors.lessons = 'Add at least one lesson with a title';
  }

  for (const lesson of titledLessons) {
    if (!lesson.videoUrl.trim() && !lesson.notes.trim() && !lesson.materialUrl.trim()) {
      errors.lessons = 'Each lesson needs a video, study notes, or downloadable material';
      break;
    }
  }

  return errors;
}

function parseExamTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function lessonCount(row: AdminCourse) {
  return row.lessons?.length ?? 0;
}

export function CoursesPage() {
  const { showToast } = useToast();
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
  const [lessons, setLessons] = useState<LessonFormState[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>> & { lessons?: string }
  >({});
  const [loadingCourse, setLoadingCourse] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setLessons([
      {
        title: 'Lesson 1',
        order: 1,
        videoUrl: '',
        durationMin: '',
        notes: '',
        materialUrl: '',
        materialName: '',
      },
    ]);
    setErrors({});
    setDrawerOpen(true);
  }

  async function openEdit(row: AdminCourse) {
    setErrors({});
    setDrawerOpen(true);
    setLoadingCourse(true);
    setEditing(row);
    setForm(toForm(row));
    setLessons(lessonsFromCourse(row.lessons));

    try {
      const full = await fetchCourse(row.id);
      setEditing(full);
      setForm(toForm(full));
      setLessons(lessonsFromCourse(full.lessons));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load course lessons');
    } finally {
      setLoadingCourse(false);
    }
  }

  function closeDrawer() {
    if (resource.saveMutation.isPending || loadingCourse) return;
    setDrawerOpen(false);
    setEditing(null);
    setLessons([]);
  }

  async function handleSave() {
    const nextErrors = validateForm(form, lessons);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body: CourseInput = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      examTags: parseExamTags(form.examTags),
      isFree: form.isFree,
      lessons: lessonsToPayload(lessons),
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
        emptyMessage="No courses found"
        isLoading={resource.query.isLoading}
        error={resource.query.isError ? resource.query.error : undefined}
        onRetry={() => void resource.query.refetch()}
        columns={[
          {
            key: 'title',
            header: 'Course',
            render: (row) => (
              <div className="course-thumb-cell">
                {row.thumbnailUrl ? (
                  <img src={row.thumbnailUrl} alt="" className="course-thumb" />
                ) : (
                  <div
                    className="course-thumb fallback"
                    style={row.thumbnailColor ? { background: row.thumbnailColor } : undefined}
                  >
                    {row.subject.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong>{row.title}</strong>
                  <div className="sub">{row.subject}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'lessons',
            header: 'Lessons',
            render: (row) => `${lessonCount(row)} lesson${lessonCount(row) === 1 ? '' : 's'}`,
          },
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
                <TableActionButton onClick={() => void openEdit(row)}>
                  Edit & lessons
                </TableActionButton>
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
                    disabled={resource.busyId === row.id || lessonCount(row) === 0}
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
        title={editing ? `Edit course — ${editing.title}` : 'Add course'}
        onClose={closeDrawer}
        onSubmit={() => void handleSave()}
        submitting={resource.saveMutation.isPending}
        submitLabel={editing ? 'Save course & lessons' : 'Create course'}
      >
        <div className="drawer-form">
          {loadingCourse ? <p className="empty-note">Loading lessons…</p> : null}

          <FormField id="course-title" label="Course title" error={errors.title}>
            <input
              id="course-title"
              className="form-input"
              value={form.title}
              disabled={loadingCourse}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Quant Foundation"
            />
          </FormField>
          <FormField id="course-subject" label="Subject" error={errors.subject}>
            <input
              id="course-subject"
              className="form-input"
              value={form.subject}
              disabled={loadingCourse}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Quant"
            />
          </FormField>
          <FormField id="course-tags" label="Exam tags (comma-separated)">
            <input
              id="course-tags"
              className="form-input"
              value={form.examTags}
              disabled={loadingCourse}
              onChange={(e) => setForm((f) => ({ ...f, examTags: e.target.value }))}
              placeholder="SSC, Banking"
            />
          </FormField>
          <CoverImageField
            label="Course cover image"
            value={form.thumbnailUrl}
            onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
          />
          <FormField id="course-color" label="Thumbnail color (fallback)">
            <input
              id="course-color"
              className="form-input"
              value={form.thumbnailColor}
              disabled={loadingCourse}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailColor: e.target.value }))}
              placeholder="#3B82F6"
            />
          </FormField>
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.isFree}
              disabled={loadingCourse}
              onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
            />
            <span>Free course</span>
          </label>

          {errors.lessons ? <p className="form-error">{errors.lessons}</p> : null}
          <LessonEditor
            lessons={lessons}
            onChange={setLessons}
            disabled={loadingCourse || resource.saveMutation.isPending}
          />
        </div>
      </Drawer>
    </div>
  );
}

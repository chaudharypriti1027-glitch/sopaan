import { useRef } from 'react';
import { ActionButton } from '../ActionButton';
import { FormField } from '../content/FormField';
import { CoverImageField } from '../media/MediaPicker';
import { useToast } from '../Toast';
import { uploadMediaFile } from '../../hooks/useMediaLibrary';
import './courses.css';

export type LessonFormState = {
  id?: string;
  title: string;
  order: number;
  videoUrl: string;
  durationMin: string;
  notes: string;
  materialUrl: string;
  materialName: string;
};

type LessonEditorProps = {
  lessons: LessonFormState[];
  onChange: (lessons: LessonFormState[]) => void;
  disabled?: boolean;
};

function emptyLesson(order: number): LessonFormState {
  return {
    title: '',
    order,
    videoUrl: '',
    durationMin: '',
    notes: '',
    materialUrl: '',
    materialName: '',
  };
}

function reindex(lessons: LessonFormState[]) {
  return lessons.map((lesson, index) => ({ ...lesson, order: index + 1 }));
}

function formatDuration(minutes: string) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return '';
  return `${value} min`;
}

export function lessonsFromCourse(
  lessons: Array<{
    id?: string;
    _id?: string;
    title: string;
    order?: number;
    videoUrl?: string;
    durationSec?: number;
    notes?: string;
    materialUrl?: string;
    materialName?: string;
  }> = [],
): LessonFormState[] {
  return [...lessons]
    .map((lesson, index) => {
      const legacyMaterial = extractLegacyMaterialUrl(lesson.notes);
      return {
        id: lesson.id ?? lesson._id,
        title: lesson.title,
        order: lesson.order ?? index + 1,
        videoUrl: lesson.videoUrl ?? '',
        durationMin:
          lesson.durationSec && lesson.durationSec > 0
            ? String(Math.max(1, Math.round(lesson.durationSec / 60)))
            : '',
        notes: lesson.notes ?? '',
        materialUrl: lesson.materialUrl ?? legacyMaterial?.url ?? '',
        materialName: lesson.materialName ?? legacyMaterial?.name ?? '',
      };
    })
    .sort((a, b) => a.order - b.order);
}

function extractLegacyMaterialUrl(notes?: string) {
  if (!notes?.trim()) return null;
  const match = notes.match(/Study file:\s*(\S+)/i);
  if (!match?.[1]) return null;
  const url = match[1];
  const name = url.split('/').pop() ?? 'Study material';
  return { url, name };
}

export function lessonsToPayload(lessons: LessonFormState[]) {
  return reindex(lessons)
    .filter((lesson) => lesson.title.trim())
    .map((lesson) => {
      const durationMin = Number(lesson.durationMin);
      return {
        ...(lesson.id ? { _id: lesson.id } : {}),
        title: lesson.title.trim(),
        order: lesson.order,
        videoUrl: lesson.videoUrl.trim() || undefined,
        durationSec:
          Number.isFinite(durationMin) && durationMin > 0
            ? Math.round(durationMin * 60)
            : undefined,
        notes: lesson.notes.trim() || undefined,
        materialUrl: lesson.materialUrl.trim() || undefined,
        materialName: lesson.materialName.trim() || undefined,
      };
    });
}

export function LessonEditor({ lessons, onChange, disabled }: LessonEditorProps) {
  const { showToast } = useToast();
  const notesFileRef = useRef<HTMLInputElement>(null);
  const materialFileRef = useRef<HTMLInputElement>(null);
  const notesLessonIndex = useRef<number | null>(null);
  const materialLessonIndex = useRef<number | null>(null);

  function updateLesson(index: number, patch: Partial<LessonFormState>) {
    onChange(lessons.map((lesson, i) => (i === index ? { ...lesson, ...patch } : lesson)));
  }

  function addLesson() {
    onChange([...lessons, emptyLesson(lessons.length + 1)]);
  }

  function removeLesson(index: number) {
    onChange(reindex(lessons.filter((_, i) => i !== index)));
  }

  function moveLesson(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const next = [...lessons];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(reindex(next));
  }

  async function uploadNotesFile(fileList: FileList | null) {
    const index = notesLessonIndex.current;
    const file = fileList?.[0];
    if (index == null || !file) return;

    const lesson = lessons[index];
    if (!lesson) return;

    try {
      if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) {
        const text = await file.text();
        updateLesson(index, { notes: text.trim() });
        showToast('Notes loaded from file');
        return;
      }

      const item = await uploadMediaFile(file);
      updateLesson(index, {
        materialUrl: item.url,
        materialName: file.name,
      });
      showToast('Study material uploaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      notesLessonIndex.current = null;
    }
  }

  async function uploadMaterialFile(fileList: FileList | null) {
    const index = materialLessonIndex.current;
    const file = fileList?.[0];
    if (index == null || !file) return;

    try {
      const item = await uploadMediaFile(file);
      updateLesson(index, {
        materialUrl: item.url,
        materialName: file.name,
      });
      showToast('Study material uploaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      materialLessonIndex.current = null;
    }
  }

  return (
    <div className="lesson-editor">
      <div className="lesson-editor-head">
        <div>
          <h3 className="lesson-editor-title">Lessons</h3>
          <p className="lesson-editor-hint">
            Add video lessons, study notes, and downloadable PDFs. Students can download materials
            offline in the app.
          </p>
        </div>
        <ActionButton variant="navy" onClick={addLesson} disabled={disabled}>
          Add lesson
        </ActionButton>
      </div>

      {lessons.length === 0 ? (
        <p className="empty-note lesson-editor-empty">
          No lessons yet. Add at least one lesson before publishing.
        </p>
      ) : (
        <div className="lesson-list">
          {lessons.map((lesson, index) => (
            <article key={lesson.id ?? `new-${index}`} className="lesson-card">
              <header className="lesson-card-head">
                <span className="lesson-order">Lesson {index + 1}</span>
                <div className="lesson-card-actions">
                  <button
                    type="button"
                    className="tbtn ghost sm"
                    disabled={disabled || index === 0}
                    onClick={() => moveLesson(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="tbtn ghost sm"
                    disabled={disabled || index === lessons.length - 1}
                    onClick={() => moveLesson(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="tbtn ghost sm danger"
                    disabled={disabled}
                    onClick={() => removeLesson(index)}
                  >
                    Remove
                  </button>
                </div>
              </header>

              <FormField id={`lesson-title-${index}`} label="Lesson title">
                <input
                  id={`lesson-title-${index}`}
                  className="form-input"
                  value={lesson.title}
                  disabled={disabled}
                  placeholder="Introduction to percentages"
                  onChange={(e) => updateLesson(index, { title: e.target.value })}
                />
              </FormField>

              <CoverImageField
                label="Lesson video"
                kind="video"
                value={lesson.videoUrl}
                onChange={(url) => updateLesson(index, { videoUrl: url })}
              />

              <FormField id={`lesson-duration-${index}`} label="Duration (minutes)">
                <input
                  id={`lesson-duration-${index}`}
                  className="form-input"
                  type="number"
                  min={1}
                  disabled={disabled}
                  value={lesson.durationMin}
                  placeholder="15"
                  onChange={(e) => updateLesson(index, { durationMin: e.target.value })}
                />
                {lesson.durationMin ? (
                  <span className="form-hint">{formatDuration(lesson.durationMin)}</span>
                ) : null}
              </FormField>

              <FormField id={`lesson-notes-${index}`} label="Study notes">
                <textarea
                  id={`lesson-notes-${index}`}
                  className="form-input form-textarea"
                  rows={5}
                  disabled={disabled}
                  value={lesson.notes}
                  placeholder="Key formulas, examples, and exam tips for this lesson…"
                  onChange={(e) => updateLesson(index, { notes: e.target.value })}
                />
                <div className="lesson-notes-actions">
                  <ActionButton
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => {
                      notesLessonIndex.current = index;
                      notesFileRef.current?.click();
                    }}
                  >
                    Import text notes
                  </ActionButton>
                  <span className="form-hint">Supports .txt and .md files</span>
                </div>
              </FormField>

              <FormField id={`lesson-material-${index}`} label="Downloadable material">
                {lesson.materialUrl ? (
                  <div className="lesson-material-chip">
                    <span className="lesson-material-name">
                      {lesson.materialName || 'Study material'}
                    </span>
                    <a
                      className="lesson-material-link"
                      href={lesson.materialUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </a>
                    <ActionButton
                      variant="ghost"
                      disabled={disabled}
                      onClick={() =>
                        updateLesson(index, { materialUrl: '', materialName: '' })
                      }
                    >
                      Remove
                    </ActionButton>
                  </div>
                ) : (
                  <p className="form-hint">Upload a PDF or document students can download offline.</p>
                )}
                <div className="lesson-notes-actions">
                  <ActionButton
                    variant="gold"
                    disabled={disabled}
                    onClick={() => {
                      materialLessonIndex.current = index;
                      materialFileRef.current?.click();
                    }}
                  >
                    Upload material
                  </ActionButton>
                  <span className="form-hint">PDF up to 50 MB</span>
                </div>
              </FormField>
            </article>
          ))}
        </div>
      )}

      <input
        ref={notesFileRef}
        type="file"
        hidden
        accept=".txt,.md,text/plain,text/markdown"
        onChange={(e) => {
          void uploadNotesFile(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={materialFileRef}
        type="file"
        hidden
        accept="application/pdf,.pdf,image/*"
        onChange={(e) => {
          void uploadMaterialFile(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

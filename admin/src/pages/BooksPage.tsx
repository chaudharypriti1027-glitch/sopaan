import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchBookGenStatus,
  generateAdminBook,
  publishAdminBook,
  type BookGenStatusResponse,
} from '../api/books';
import { formatApiError } from '../api/errors';
import { ActionButton } from '../components/ActionButton';
import { FormField } from '../components/content/FormField';
import { Pill } from '../components/Pill';
import { useToast } from '../components/Toast';
import './books.css';

const SUBJECTS = ['quant', 'reasoning', 'english', 'gk', 'current_affairs', 'static_gk'] as const;
const COVER_THEMES = ['navy', 'gold', 'sage', 'deep', 'rust'] as const;

function statusTone(state: BookGenStatusResponse['state']): 'sage' | 'red' | 'gold' | 'muted' {
  switch (state) {
    case 'completed':
      return 'sage';
    case 'failed':
      return 'red';
    case 'running':
      return 'gold';
    default:
      return 'muted';
  }
}

function statusLabel(state: BookGenStatusResponse['state']) {
  switch (state) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'running':
      return 'Running';
    default:
      return 'Queued';
  }
}

export function BooksPage() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('gk');
  const [audience, setAudience] = useState('SSC CGL aspirants');
  const [chaptersText, setChaptersText] = useState('');
  const [coverTheme, setCoverTheme] = useState<(typeof COVER_THEMES)[number]>('navy');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  const chapters = useMemo(
    () =>
      chaptersText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [chaptersText],
  );

  const statusQuery = useQuery({
    queryKey: ['admin', 'books', 'status', activeJobId],
    queryFn: () => fetchBookGenStatus(activeJobId!),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === 'queued' || state === 'running' ? 2500 : false;
    },
  });

  useEffect(() => {
    if (statusQuery.data?.bookId) {
      setActiveBookId(statusQuery.data.bookId);
    }
  }, [statusQuery.data?.bookId]);

  const generateMutation = useMutation({
    mutationFn: () =>
      generateAdminBook({
        title: title.trim(),
        subject,
        audience: audience.trim(),
        chapters,
        coverTheme,
        language: 'en',
      }),
    onSuccess: (result) => {
      setActiveJobId(result.jobId);
      setActiveBookId(result.bookId);
      showToast('Book generation started');
    },
    onError: (err: Error) => showToast(formatApiError(err)),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishAdminBook(activeBookId!),
    onSuccess: (result) => {
      showToast(`Published “${result.book.title}”`);
    },
    onError: (err: Error) => showToast(formatApiError(err)),
  });

  const handleGenerate = () => {
    if (!title.trim()) {
      showToast('Enter a book title');
      return;
    }
    if (!audience.trim()) {
      showToast('Enter the target audience');
      return;
    }
    if (chapters.length === 0) {
      showToast('Add at least one chapter (one per line)');
      return;
    }
    generateMutation.mutate();
  };

  const status = statusQuery.data;

  return (
    <div className="books-page">
      <section className="panel">
        <h2>Generate AI book</h2>
        <p className="panel-sub">
          Create a draft book with AI-written chapters. Publish when generation completes.
        </p>

        <div className="books-form">
          <FormField id="book-title" label="Title">
            <input
              id="book-title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Polity quick revision"
            />
          </FormField>
          <label className="field">
            <span>Subject</span>
            <select
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value as typeof subject)}
            >
              {SUBJECTS.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <FormField id="book-audience" label="Audience">
            <input
              id="book-audience"
              className="form-input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="SSC CGL aspirants"
            />
          </FormField>
          <label className="field">
            <span>Cover theme</span>
            <select
              className="form-input"
              value={coverTheme}
              onChange={(e) => setCoverTheme(e.target.value as typeof coverTheme)}
            >
              {COVER_THEMES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Chapters (one per line)</span>
            <textarea
              className="form-input form-textarea"
              value={chaptersText}
              onChange={(e) => setChaptersText(e.target.value)}
              rows={6}
              placeholder={'Introduction\nConstitution basics\nFundamental rights'}
            />
          </label>
        </div>

        <ActionButton onClick={handleGenerate} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Starting…' : 'Start generation'}
        </ActionButton>
      </section>

      {status ? (
        <section className="panel">
          <div className="books-status-head">
            <h2>Generation status</h2>
            <Pill tone={statusTone(status.state)}>{statusLabel(status.state)}</Pill>
          </div>
          <p className="panel-sub">Job {status.jobId}</p>
          <div className="books-progress">
            <div className="books-progress-bar" style={{ width: `${status.progress}%` }} />
          </div>
          <p className="books-meta">
            {status.metrics?.chaptersDone ?? 0} / {status.metrics?.chaptersTotal ?? chapters.length}{' '}
            chapters
          </p>
          {status.error ? <p className="books-error">{status.error}</p> : null}
          {status.state === 'completed' && activeBookId ? (
            <ActionButton onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? 'Publishing…' : 'Publish book'}
            </ActionButton>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

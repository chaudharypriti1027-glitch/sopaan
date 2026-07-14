import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../config/env';
import { trackLibraryEvent } from '../analytics/libraryAnalytics';
import { getAccessToken } from '../lib/secure';
import { createRequestId } from '../observability/requestId';

export type BookExplainStreamResult = {
  text: string;
  cached: boolean;
  ok: boolean;
  message?: string;
};

type SsePayload =
  | { type: 'delta'; text: string }
  | { type: 'done'; ok: boolean; cached?: boolean }
  | { type: 'error'; ok: false; message: string };

function parseSseChunk(buffer: string): { events: SsePayload[]; remainder: string } {
  const events: SsePayload[] = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    const line = part
      .split('\n')
      .find((entry) => entry.startsWith('data:'));
    if (!line) {
      continue;
    }

    const json = line.replace(/^data:\s*/, '');
    try {
      events.push(JSON.parse(json) as SsePayload);
    } catch {
      /* ignore malformed chunks */
    }
  }

  return { events, remainder };
}

export function useBookExplain(bookId: string | undefined) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setText('');
    setCached(false);
    setError(null);
    setIsStreaming(false);
  }, []);

  const explain = useCallback(
    async (body: { page: number; text: string }) => {
      if (!bookId) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setText('');
      setCached(false);
      setError(null);
      setIsStreaming(true);

      let streamFailed = false;

      try {
        const token = await getAccessToken();
        const response = await fetch(`${config.apiBaseUrl}/books/${bookId}/explain`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
            'x-request-id': createRequestId(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/json')) {
          const json = (await response.json()) as { ok?: boolean; message?: string };
          if (json.ok === false) {
            streamFailed = true;
            setError(json.message ?? 'AI is busy right now — try again in a moment.');
          }
          setIsStreaming(false);
          return;
        }

        if (!response.ok || !response.body) {
          streamFailed = true;
          setError('Could not load explanation');
          setIsStreaming(false);
          return;
        }

        void trackLibraryEvent('explain_used', bookId, { page: body.page });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer);
          buffer = parsed.remainder;

          for (const event of parsed.events) {
            if (event.type === 'delta') {
              fullText += event.text;
              setText(fullText);
            } else if (event.type === 'done') {
              setCached(Boolean(event.cached));
            } else if (event.type === 'error') {
              streamFailed = true;
              setError(event.message);
            }
          }
        }

        if (!fullText && !streamFailed) {
          setError('AI is busy right now — try again in a moment.');
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setError('AI is busy right now — try again in a moment.');
      } finally {
        if (abortRef.current === controller) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      }
    },
    [bookId],
  );

  useEffect(() => () => reset(), [reset]);

  return {
    text,
    isStreaming,
    cached,
    error,
    explain,
    reset,
  };
}

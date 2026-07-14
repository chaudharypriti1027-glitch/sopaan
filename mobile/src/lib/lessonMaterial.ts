import { config } from '../config/env';

/** Turn relative /uploads paths into absolute URLs for mobile downloads. */
export function resolveContentUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${config.apiOrigin}${trimmed}`;
  return trimmed;
}

const LEGACY_MATERIAL_PATTERN = /Study file:\s*(\S+)/i;

export function resolveLessonMaterial(lesson: {
  materialUrl?: string;
  materialName?: string;
  notes?: string;
}) {
  if (lesson.materialUrl?.trim()) {
    return {
      url: resolveContentUrl(lesson.materialUrl),
      name: lesson.materialName?.trim() || 'Study material',
    };
  }

  const notes = lesson.notes ?? '';
  const match = notes.match(LEGACY_MATERIAL_PATTERN);
  if (!match?.[1]) return null;

  const url = resolveContentUrl(match[1]);
  const name = lesson.materialName?.trim() || url.split('/').pop() || 'Study material';
  return { url, name };
}

export function fileExtensionFromUrl(url: string, fallback = 'bin'): string {
  const clean = url.split('?')[0] ?? url;
  const ext = clean.split('.').pop();
  if (!ext || ext.includes('/')) return fallback;
  return ext.toLowerCase();
}

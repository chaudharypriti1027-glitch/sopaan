import type { LiveAvatarTone } from './liveTheme';

export function liveInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function liveAvatarTone(name: string): LiveAvatarTone {
  const code = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  if (code % 3 === 0) return 'gold';
  if (code % 3 === 1) return 'navy';
  return 'sage';
}

export function formatLiveElapsed(startedAt?: string | null): string {
  if (!startedAt) {
    return '00:00';
  }

  const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(elapsedSec / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsedSec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.includes('?') ||
    /^q\d+/i.test(trimmed) ||
    /^(what|how|why|when|where|can|could|please|repeat|explain|doubt)/i.test(trimmed)
  );
}

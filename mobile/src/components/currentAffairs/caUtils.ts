import type { CurrentAffair } from '../../api/types';

export type CaSortMode = 'latest' | 'trending';

export function estimateReadTime(item: CurrentAffair): string {
  const words = (item.summary ?? item.title ?? '').split(/\s+/).length;
  const minutes = Math.max(2, Math.min(8, Math.ceil(words / 45)));
  return `${minutes} min`;
}

export function isTrendingAffair(item: CurrentAffair): boolean {
  if (item.quizQuestions && item.quizQuestions.length > 0) {
    return true;
  }
  if (!item.publishedAt) {
    return false;
  }
  const published = new Date(item.publishedAt).getTime();
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return published >= threeDaysAgo;
}

export function getExamWeight(item: CurrentAffair): 'High' | 'Medium' {
  if (item.quizQuestions && item.quizQuestions.length > 0) {
    return 'High';
  }
  const highCategories = ['Economy', 'International', 'Defence', 'Polity', 'Schemes', 'Environment'];
  if (item.category && highCategories.includes(item.category)) {
    return 'High';
  }
  return 'Medium';
}

export function affairTags(item: CurrentAffair): string[] {
  const tags: string[] = [];
  if (item.category) {
    tags.push(item.category);
  }
  if (item.state && item.state !== 'National') {
    tags.push(item.state);
  }
  return tags.slice(0, 3);
}

export function isPublishedToday(item: CurrentAffair): boolean {
  if (!item.publishedAt) {
    return false;
  }
  const d = new Date(item.publishedAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function sortAffairs(items: CurrentAffair[], mode: CaSortMode): CurrentAffair[] {
  const copy = [...items];
  if (mode === 'trending') {
    return copy.sort((a, b) => {
      const ta = isTrendingAffair(a) ? 1 : 0;
      const tb = isTrendingAffair(b) ? 1 : 0;
      if (tb !== ta) {
        return tb - ta;
      }
      return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
    });
  }
  return copy.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function formatViewCount(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const value = ((hash % 200) + 30) / 10;
  return `${value.toFixed(1)}k`;
}

export function categoryStyle(category?: string) {
  const key = (category ?? 'General').toLowerCase();
  const map: Record<string, { color: string; bg: string }> = {
    economy: { color: '#059669', bg: '#ECFDF5' },
    international: { color: '#2563EB', bg: '#EFF6FF' },
    defence: { color: '#DC2626', bg: '#FEF2F2' },
    defense: { color: '#DC2626', bg: '#FEF2F2' },
    schemes: { color: '#7C3AED', bg: '#F5F3FF' },
    polity: { color: '#EA580C', bg: '#FFF7ED' },
    politics: { color: '#EA580C', bg: '#FFF7ED' },
    national: { color: '#232A4D', bg: '#E9EBF3' },
    science: { color: '#0891B2', bg: '#ECFEFF' },
    environment: { color: '#16A34A', bg: '#F0FDF4' },
    sports: { color: '#DB2777', bg: '#FDF2F8' },
    health: { color: '#DB2777', bg: '#FDF2F8' },
  };
  return map[key] ?? { color: '#64748B', bg: '#F1F5F9' };
}

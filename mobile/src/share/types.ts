export type ShareCardKind = 'rank' | 'readiness' | 'streak';

export type ShareCardMetric = {
  label: string;
  value: string;
};

export type ShareCardData = {
  kind: ShareCardKind;
  userName: string;
  headline: string;
  subtitle?: string;
  metrics: ShareCardMetric[];
  footerNote?: string;
};

export function shareCardKindLabel(kind: ShareCardKind): string {
  if (kind === 'rank') return 'Mock result';
  if (kind === 'readiness') return 'Exam readiness';
  return 'Study streak';
}

export function buildShareMessage(data: ShareCardData, referralLink?: string): string {
  const lines = [
    `${shareCardKindLabel(data.kind)} on Sopaan — ${data.headline}`,
    data.subtitle,
    referralLink ? `Join me on Sopaan: ${referralLink}` : undefined,
  ].filter(Boolean);

  return lines.join('\n');
}

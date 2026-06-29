export type ChartPoint = {
  label: string;
  value: number;
};

export function summarizeChartPoints(
  points: ChartPoint[],
  formatValue: (value: number) => string = String,
): string {
  if (points.length === 0) {
    return '';
  }
  return points.map((point) => `${point.label} ${formatValue(point.value)}`).join(', ');
}

export function formatProgressSummary(
  label: string | undefined,
  value: number,
  max: number,
): string {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  if (label) {
    return `${label}, ${percent} percent`;
  }
  return `${percent} percent`;
}

export function formatRingSummary(
  label: string | undefined,
  value: number,
  max: number,
): string {
  const rounded = Math.round(value);
  const maxRounded = Math.round(max);
  if (label) {
    return `${label}, ${rounded} of ${maxRounded}`;
  }
  return `${rounded} of ${maxRounded}`;
}

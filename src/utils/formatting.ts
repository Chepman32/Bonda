export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMetric(value: number): string {
  return value.toFixed(1);
}

export function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

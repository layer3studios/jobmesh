// FILE: admin/scraper-health/parts/scraper-health-format.ts
// Shared formatting for the Scraper Health dashboard. `now` is injectable
// throughout so tests are deterministic.

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/** A run's age in words: "just now", "12m ago", "3h ago", "2d ago". */
export function formatRunAge(isoDate: string | null | undefined, now: Date = new Date()): string {
  if (!isoDate) return 'never';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'never';

  const diffMs = now.getTime() - then;
  if (diffMs < MS_PER_MINUTE) return 'just now';
  if (diffMs < MS_PER_HOUR) return `${Math.floor(diffMs / MS_PER_MINUTE)}m ago`;
  if (diffMs < MS_PER_DAY) return `${Math.floor(diffMs / MS_PER_HOUR)}h ago`;
  return `${Math.floor(diffMs / MS_PER_DAY)}d ago`;
}

/** 12_500 → "12.5s"; sub-second durations stay in milliseconds. */
export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '—';
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < MS_PER_MINUTE) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(durationMs / MS_PER_MINUTE);
  return `${minutes}m ${Math.round((durationMs % MS_PER_MINUTE) / 1000)}s`;
}

export const percent = (value: number): string => `${value.toFixed(1)}%`;

/** Absolute timestamp for table cells, where "3h ago" is too coarse. */
export function formatTimestamp(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

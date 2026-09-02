// FILE: admin/queues/parts/queue-format.ts
// Shared formatting for the Queue Monitor.

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/** A queue with work waiting this long is stalled, not merely busy. */
export const STALL_THRESHOLD_MS = 10 * MS_PER_MINUTE;

/** 250_000 → "4m"; 7_800_000 → "2h 10m". Null means nothing is pending. */
export function formatAge(ageMs: number | null): string {
  if (ageMs === null || !Number.isFinite(ageMs) || ageMs < 0) return '—';
  if (ageMs < MS_PER_MINUTE) return `${Math.floor(ageMs / 1000)}s`;
  if (ageMs < MS_PER_HOUR) return `${Math.floor(ageMs / MS_PER_MINUTE)}m`;
  if (ageMs < MS_PER_DAY) {
    const hours = Math.floor(ageMs / MS_PER_HOUR);
    const minutes = Math.floor((ageMs % MS_PER_HOUR) / MS_PER_MINUTE);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(ageMs / MS_PER_DAY);
  const hours = Math.floor((ageMs % MS_PER_DAY) / MS_PER_HOUR);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

export const isStalled = (ageMs: number | null): boolean =>
  ageMs !== null && ageMs > STALL_THRESHOLD_MS;

/** Absolute timestamp for table cells, where a relative age is too coarse. */
export function formatTimestamp(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** Long ids are unreadable in a narrow cell; the full value stays in `title`. */
export function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

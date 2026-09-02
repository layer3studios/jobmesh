// FILE: admin/parts/mission-format.ts
// Formatting and threshold rules for Mission Control. Thresholds live here so
// the status strip and its copy can never disagree about what counts as bad.

/** A scrape runs daily; past this the last success is old enough to chase. */
export const SCRAPER_STALE_MS = 26 * 60 * 60 * 1000;
/** Below this the uploads volume needs attention before it bites. */
export const DISK_LOW_BYTES = 2 * 1024 * 1024 * 1024;
/** Matches the queue monitor's own stall line. */
export const QUEUE_STALL_MS = 10 * 60 * 1000;

const MINUTE_MS = 60_000;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

/** "4m ago", "2h ago", "3d ago"; "never" when there is no timestamp. */
export function relativeTime(isoDate: string | null, now: Date = new Date()): string {
  if (!isoDate) return 'never';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'never';
  const diff = now.getTime() - then;
  if (diff < MINUTE_MS) return 'just now';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  return `${Math.floor(diff / DAY_MS)}d ago`;
}

export function isScraperStale(isoDate: string | null, now: Date = new Date()): boolean {
  if (!isoDate) return true;
  const then = new Date(isoDate).getTime();
  return Number.isNaN(then) || now.getTime() - then > SCRAPER_STALE_MS;
}

/** 239_758_303_232 → "223.3 GB". */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit >= 3 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Direction as a WORD, so the movement survives without colour. `null` means
 * flat — a zero delta is not an improvement and should not read as one.
 */
export function deltaWording(delta: number): { word: 'up' | 'down' | 'flat'; arrow: string } {
  if (delta > 0) return { word: 'up', arrow: '▲' };
  if (delta < 0) return { word: 'down', arrow: '▼' };
  return { word: 'flat', arrow: '—' };
}

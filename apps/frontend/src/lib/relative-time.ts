// FILE: src/lib/relative-time.ts
// Tiny relative-time formatter for invite expiry. No external dependency (C_deps).
// Coarse by design: an invite only ever needs "how much longer until it lapses".

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * Human expiry phrasing for an ISO timestamp:
 *   past          → 'expired'
 *   < 1 hour left → 'expires today'
 *   < 1 day left  → 'in N hours'
 *   otherwise     → 'in N days'
 * `now` is injectable so tests are deterministic.
 */
export function formatRelativeExpiry(expiresAt: string, now: Date = new Date()): string {
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return 'expired';
  const diffMs = target - now.getTime();
  if (diffMs <= 0) return 'expired';

  const days = Math.floor(diffMs / MS_PER_DAY);
  if (days >= 1) return `in ${days} ${days === 1 ? 'day' : 'days'}`;

  const hours = Math.floor(diffMs / MS_PER_HOUR);
  if (hours >= 1) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;

  return 'expires today';
}

/** True when the invite's expiry has already lapsed. */
export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return true;
  return target <= now.getTime();
}

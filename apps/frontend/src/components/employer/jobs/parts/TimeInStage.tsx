// FILE: src/components/employer/jobs/parts/TimeInStage.tsx
// How long a candidate has sat in their CURRENT stage — the "is anyone stuck?"
// signal on the ranked table and pipeline cards.
//
// Not formatCompactDuration (score-badge-helpers): that one reads in minutes and
// hours because it labels timeline events, where "3h ago" is the useful precision.
// Stage age is a staleness measure, so it coarsens the other way — days, weeks,
// months — and crosses into a warning colour once a week has passed.

const MILLISECONDS_PER_DAY = 86_400_000;
const WARNING_THRESHOLD_DAYS = 7;

/** Whole days elapsed, or null when the timestamp is missing or unparseable. */
export function daysInStage(
  movedAt: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!movedAt) return null;
  const then = new Date(movedAt).getTime();
  if (!Number.isFinite(then)) return null;
  // A clock-skewed future timestamp clamps to 0 rather than rendering "-3d".
  return Math.max(0, Math.floor((now - then) / MILLISECONDS_PER_DAY));
}

/** "today" · "3d" · "2w" · "5mo" — coarsens as the wait gets longer. */
export function formatDaysInStage(days: number): string {
  if (days < 1) return 'today';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

/**
 * Renders nothing when the timestamp is absent — an application that has never
 * moved has no stage age to report, and a dash would read as a real value.
 */
export default function TimeInStage({
  movedAt, title,
}: { movedAt: string | null | undefined; title?: string }) {
  const days = daysInStage(movedAt);
  if (days == null) return null;
  const isStale = days > WARNING_THRESHOLD_DAYS;

  return (
    <span
      title={title ?? `In this stage for ${formatDaysInStage(days)}`}
      style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: isStale ? 'var(--warning)' : 'var(--ink-faint)',
        whiteSpace: 'nowrap',
      }}
    >
      {formatDaysInStage(days)}
    </span>
  );
}

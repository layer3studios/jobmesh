// FILE: src/components/employer/jobs/deadline-helpers.ts
// Formatting and urgency for application deadlines. Shared by the live preview,
// the employer posting header and the public apply page, so all three describe the
// same date the same way.
//
// EVERYTHING HERE IS IST. This product is India-only, an employer picks a calendar
// day rather than an instant, and a deadline rendered in the viewer's local zone
// would read as a different day for anyone travelling. Asia/Kolkata is pinned, and
// the label says so.

const IST_TIME_ZONE = 'Asia/Kolkata';
/** Inside this many days the deadline is worth flagging rather than just stating. */
export const DEADLINE_SOON_DAYS = 3;
const MILLISECONDS_PER_DAY = 86_400_000;

/** "20 Aug 2026 IST" — or null when there is no deadline to show. */
export function formatDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  // A bare yyyy-mm-dd from the date input is a calendar day: anchor it to the end
  // of that day in IST so it formats as the day the employer actually picked.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59+05:30` : value;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const formatted = parsed.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: IST_TIME_ZONE,
  });
  return `${formatted} IST`;
}

export type DeadlineUrgency = 'none' | 'upcoming' | 'soon' | 'passed';

/**
 * How a deadline should read right now.
 *
 * 'passed' is reported for any elapsed deadline regardless of posting status — the
 * caller decides whether that matters. An active posting with a passed deadline is
 * the interesting case: auto-close has not run, or was never enabled, and the apply
 * endpoint is already refusing submissions.
 */
export function deadlineUrgency(
  value: string | null | undefined,
  now: number = Date.now(),
): DeadlineUrgency {
  if (!value) return 'none';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'none';
  const remainingMs = parsed.getTime() - now;
  if (remainingMs <= 0) return 'passed';
  return remainingMs <= DEADLINE_SOON_DAYS * MILLISECONDS_PER_DAY ? 'soon' : 'upcoming';
}

/** True once the deadline has elapsed — the single test the apply page gates on. */
export function isDeadlinePassed(value: string | null | undefined, now: number = Date.now()): boolean {
  return deadlineUrgency(value, now) === 'passed';
}

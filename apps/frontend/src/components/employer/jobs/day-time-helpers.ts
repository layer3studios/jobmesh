// FILE: src/components/employer/jobs/day-time-helpers.ts
// Pure readers over a date's interview_times: which are active, what links they
// carry, and which mode/link/phone/address dominates (used to pre-fill the
// add-times panel from what is already on the selected date).

import type { InterviewMode, InterviewTime } from '@/types/employer-interviews';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

export interface LinkSummaryEntry { link: string; count: number }

const isActive = (time: InterviewTime): boolean =>
  time.status === 'available' || time.status === 'booked';

/** Active (available + booked) times on one IST calendar date, earliest first. */
export function activeTimesOnDate(times: InterviewTime[], dateIso: string): InterviewTime[] {
  return times
    .filter((time) => isActive(time) && utcIsoToIstLocal(time.startAtUtc).slice(0, 10) === dateIso)
    .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
}

/** Cancelled/past times on one IST calendar date. */
export function inactiveTimesOnDate(times: InterviewTime[], dateIso: string): InterviewTime[] {
  return times.filter(
    (time) => !isActive(time) && utcIsoToIstLocal(time.startAtUtc).slice(0, 10) === dateIso,
  );
}

/** The most frequent non-null value, or null when there are none. */
export function mostCommon<T>(values: (T | null | undefined)[]): T | null {
  const counts = new Map<T, number>();
  for (const value of values) {
    if (value === null || value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let winner: T | null = null;
  let best = 0;
  for (const [value, count] of counts) {
    if (count > best) { winner = value; best = count; }
  }
  return winner;
}

/**
 * Unique meeting links across the given times, most-used first. Renders as one
 * line below the chips — a link is a property of the DATE, not of each chip.
 */
export function summarizeLinks(times: InterviewTime[]): LinkSummaryEntry[] {
  const counts = new Map<string, number>();
  for (const time of times) {
    if (!time.meetingUrl) continue;
    counts.set(time.meetingUrl, (counts.get(time.meetingUrl) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([link, count]) => ({ link, count }))
    .sort((a, b) => b.count - a.count);
}

/** The mode most of this date's times were created with. */
export function dominantMode(times: InterviewTime[]): InterviewMode | null {
  return mostCommon(times.map((time) => time.mode));
}

/** Strip the scheme for compact display: "meet.google.com/abc-defg". */
export function shortLink(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

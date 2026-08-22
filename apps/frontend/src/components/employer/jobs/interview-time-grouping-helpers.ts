// FILE: src/components/employer/jobs/interview-time-grouping-helpers.ts
// Pure grouping for the day-grouped times view. Grouping is by IST calendar
// day, NOT UTC day: 2026-08-01T19:00:00Z is Aug 1 in UTC but 12:30 AM Aug 2
// in IST — it belongs in the Aug 2 group. Cancelled/past times are split out
// so day groups can hide them behind a toggle.

import type { InterviewTime } from '../../../types/employer-interviews';
import { utcIsoToIstLocal } from '../../../utils/ist-datetime';
import { formatInterviewDayHeading } from '../../../utils/format-interview-time';

const ACTIVE_STATUSES = new Set(['available', 'booked']);

export interface InterviewDayGroupData {
  /** IST calendar day, 'YYYY-MM-DD' — feeds the date picker directly. */
  dateIso: string;
  /** e.g. "Sat, 2 August 2026". */
  heading: string;
  /** available + booked, startAtUtc ascending. */
  activeTimes: InterviewTime[];
  /** cancelled/past, startAtUtc ascending — hidden behind a toggle. */
  cancelledTimes: InterviewTime[];
}

export interface InterviewTimesSummary {
  total: number;
  dayCount: number;
  available: number;
  booked: number;
  cancelled: number;
}

const istDateOf = (time: InterviewTime): string => utcIsoToIstLocal(time.startAtUtc).slice(0, 10);

/** Flat times → day groups sorted by date, each group's times sorted by start. */
export function groupTimesByIstDate(times: InterviewTime[]): InterviewDayGroupData[] {
  const byDate = new Map<string, InterviewTime[]>();
  for (const time of times) {
    const dateIso = istDateOf(time);
    const bucket = byDate.get(dateIso) ?? [];
    bucket.push(time);
    byDate.set(dateIso, bucket);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateIso, bucket]) => {
      const sorted = [...bucket].sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
      return {
        dateIso,
        heading: formatInterviewDayHeading(sorted[0].startAtUtc),
        activeTimes: sorted.filter((time) => ACTIVE_STATUSES.has(time.status)),
        cancelledTimes: sorted.filter((time) => !ACTIVE_STATUSES.has(time.status)),
      };
    });
}

/** Counts for the summary bar: "12 times across 3 days · 8 available · …". */
export function summarizeTimes(times: InterviewTime[]): InterviewTimesSummary {
  return {
    total: times.length,
    dayCount: new Set(times.map(istDateOf)).size,
    available: times.filter((time) => time.status === 'available').length,
    booked: times.filter((time) => time.status === 'booked').length,
    cancelled: times.filter((time) => !ACTIVE_STATUSES.has(time.status)).length,
  };
}

// FILE: tests/components/employer/jobs/interview-time-grouping-helpers.test.ts
// Grouping is by IST calendar day, not UTC day — the core correctness claim.
import { describe, it, expect } from 'vitest';
import { groupTimesByIstDate, summarizeTimes } from '@/components/employer/jobs/interview-time-grouping-helpers';
import type { InterviewTime } from '@/types/employer-interviews';

function time(id: string, startAtUtc: string, status: InterviewTime['status'] = 'available'): InterviewTime {
  return {
    id, startAtUtc, durationMinutes: 45, timezoneId: 'Asia/Kolkata', status,
    mode: 'video', meetingUrl: null, locationText: null, bookedByApplicationId: null, bookedAt: null,
  };
}

describe('groupTimesByIstDate', () => {
  it('groups by IST date, not UTC date', () => {
    // 19:00Z Aug 1 = 12:30 AM Aug 2 IST; 00:30Z Aug 2 = 6:00 AM Aug 2 IST —
    // different UTC days, SAME IST day. Both must land in the Aug 2 group.
    const groups = groupTimesByIstDate([
      time('a', '2026-08-01T19:00:00.000Z'),
      time('b', '2026-08-02T00:30:00.000Z'),
      time('c', '2026-08-01T10:00:00.000Z'), // 3:30 PM Aug 1 IST — its own group
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].dateIso).toBe('2026-08-01');
    expect(groups[0].activeTimes.map((t) => t.id)).toEqual(['c']);
    expect(groups[1].dateIso).toBe('2026-08-02');
    expect(groups[1].activeTimes.map((t) => t.id)).toEqual(['a', 'b']);
    expect(groups[1].heading).toBe('Sun, 2 August 2026');
  });

  it('splits cancelled times out of the active list, sorted by start', () => {
    const groups = groupTimesByIstDate([
      time('late', '2026-08-02T10:00:00.000Z'),
      time('gone', '2026-08-02T06:00:00.000Z', 'cancelled'),
      time('early', '2026-08-02T04:00:00.000Z'),
    ]);
    expect(groups[0].activeTimes.map((t) => t.id)).toEqual(['early', 'late']);
    expect(groups[0].cancelledTimes.map((t) => t.id)).toEqual(['gone']);
  });
});

describe('summarizeTimes', () => {
  it('counts totals, IST day span, and per-status buckets', () => {
    const summary = summarizeTimes([
      time('a', '2026-08-01T19:00:00.000Z'), // Aug 2 IST
      time('b', '2026-08-02T00:30:00.000Z'), // Aug 2 IST
      time('c', '2026-08-04T04:30:00.000Z', 'booked'),
      time('d', '2026-08-04T06:30:00.000Z', 'cancelled'),
    ]);
    expect(summary).toEqual({ total: 4, dayCount: 2, available: 2, booked: 1, cancelled: 1 });
  });
});

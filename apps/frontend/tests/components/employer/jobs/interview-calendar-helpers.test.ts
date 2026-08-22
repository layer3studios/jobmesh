// FILE: tests/components/employer/jobs/interview-calendar-helpers.test.ts
// Pure month-grid math: Monday-first layout, IST grouping, dot counts.
import { describe, it, expect } from 'vitest';
import { buildMonthGrid, defaultSelectedDate, monthLabel, stepMonth } from '@/components/employer/jobs/interview-calendar-helpers';
import type { InterviewTime } from '@/types/employer-interviews';

function time(id: string, startAtUtc: string, status: InterviewTime['status'] = 'available'): InterviewTime {
  return {
    id, startAtUtc, durationMinutes: 45, timezoneId: 'Asia/Kolkata', status,
    mode: 'video', meetingUrl: null, locationText: null, bookedByApplicationId: null, bookedAt: null,
  };
}

describe('buildMonthGrid', () => {
  it('August 2026: starts Saturday, 31 days, 5 trailing July days, 6 full weeks', () => {
    const cells = buildMonthGrid(2026, 8, [], '2026-08-01');
    expect(cells.length % 7).toBe(0);
    expect(cells).toHaveLength(42); // 5 leading + 31 + 6 trailing
    // Leading trailing days: Jul 27–31 (Mon–Fri), then Sat Aug 1.
    expect(cells.slice(0, 5).map((cell) => cell.dateIso)).toEqual([
      '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31',
    ]);
    expect(cells.slice(0, 5).every((cell) => !cell.isCurrentMonth)).toBe(true);
    expect(cells[5].dateIso).toBe('2026-08-01');
    expect(cells[5].isCurrentMonth).toBe(true);
    expect(cells[5].isToday).toBe(true);
    expect(cells.filter((cell) => cell.isCurrentMonth)).toHaveLength(31);
  });

  it('counts dots per IST date; cancelled times produce none', () => {
    const cells = buildMonthGrid(2026, 8, [
      time('a', '2026-08-01T19:00:00.000Z'), // 12:30 AM Aug 2 IST
      time('b', '2026-08-02T04:00:00.000Z', 'booked'),
      time('c', '2026-08-02T06:00:00.000Z', 'cancelled'),
    ], '2026-08-01');
    const aug2 = cells.find((cell) => cell.dateIso === '2026-08-02');
    expect(aug2?.availableCount).toBe(1);
    expect(aug2?.bookedCount).toBe(1);
  });

  it('marks past dates relative to today', () => {
    const cells = buildMonthGrid(2026, 8, [], '2026-08-10');
    expect(cells.find((cell) => cell.dateIso === '2026-08-09')?.isPast).toBe(true);
    expect(cells.find((cell) => cell.dateIso === '2026-08-10')?.isPast).toBe(false);
  });
});

describe('month navigation + default date', () => {
  it('stepMonth crosses year boundaries; monthLabel renders', () => {
    expect(stepMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(stepMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(monthLabel(2026, 8)).toBe('August 2026');
  });

  it('defaultSelectedDate picks the earliest upcoming available date, else today', () => {
    expect(defaultSelectedDate([
      time('a', '2026-08-05T04:00:00.000Z'),
      time('b', '2026-08-03T04:00:00.000Z'),
      time('c', '2026-08-01T04:00:00.000Z', 'booked'),
    ], '2026-08-02')).toBe('2026-08-03');
    expect(defaultSelectedDate([], '2026-08-02')).toBe('2026-08-02');
  });
});

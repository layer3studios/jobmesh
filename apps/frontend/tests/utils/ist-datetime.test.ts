// FILE: tests/utils/ist-datetime.test.ts
// The timezone contract: datetime-local values are IST wall-clock, converted
// with fixed +05:30 arithmetic — never via new Date(rawValue).
import { describe, it, expect } from 'vitest';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';
import { formatInterviewTime, formatInterviewTimeShort } from '@/utils/format-interview-time';

describe('ist-datetime', () => {
  it('15:00 IST converts to 09:30Z', () => {
    expect(istLocalToUtcIso('2026-08-10T15:00')).toBe('2026-08-10T09:30:00.000Z');
  });

  it('round trip returns the original wall-clock value', () => {
    expect(utcIsoToIstLocal(istLocalToUtcIso('2026-08-10T15:00') as string)).toBe('2026-08-10T15:00');
  });

  it('midnight IST lands on the previous UTC day', () => {
    expect(istLocalToUtcIso('2026-08-10T00:15')).toBe('2026-08-09T18:45:00.000Z');
    expect(utcIsoToIstLocal('2026-08-09T18:45:00.000Z')).toBe('2026-08-10T00:15');
  });

  it('returns null for garbage input instead of guessing', () => {
    expect(istLocalToUtcIso('not-a-date')).toBeNull();
    expect(istLocalToUtcIso('')).toBeNull();
  });
});

describe('format-interview-time', () => {
  it('renders the full IST line with the weekday spelled out', () => {
    expect(formatInterviewTime('2026-08-10T09:30:00.000Z')).toBe('Monday, 10 August 2026, 3:00 PM IST');
  });

  it('renders the short variant', () => {
    expect(formatInterviewTimeShort('2026-08-10T09:30:00.000Z')).toBe('Mon 10 Aug, 3:00 PM IST');
  });

  it('always shows the IST zone label', () => {
    expect(formatInterviewTime('2026-01-01T00:00:00.000Z')).toContain('IST');
  });
});

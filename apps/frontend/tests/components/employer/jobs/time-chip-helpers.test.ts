// FILE: tests/components/employer/jobs/time-chip-helpers.test.ts
// Pure grid generation: intervals from duration, 8:00–20:00 IST range,
// already-added flagging, past exclusion.
import { describe, it, expect } from 'vitest';
import { buildTimeChips, chipIntervalMinutes } from '@/components/employer/jobs/time-chip-helpers';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';

const FUTURE_DATE = '2030-08-10';
const EARLY_NOW = new Date('2030-01-01T00:00:00Z');

describe('buildTimeChips', () => {
  it('45-min duration generates 45-min-interval chips from 8:00 AM to 7:15 PM', () => {
    const chips = buildTimeChips(FUTURE_DATE, 45, [], EARLY_NOW);
    expect(chips).toHaveLength(16);
    expect(chips[0].label).toBe('8:00 AM');
    expect(chips[1].label).toBe('8:45 AM');
    expect(chips[2].label).toBe('9:30 AM');
    expect(chips[chips.length - 1].label).toBe('7:15 PM');
    // Every chip converts as IST wall-clock.
    expect(chips[0].utcIso).toBe(istLocalToUtcIso(`${FUTURE_DATE}T08:00`));
  });

  it('30-min → 24 chips; 60-min → 12 chips', () => {
    expect(buildTimeChips(FUTURE_DATE, 30, [], EARLY_NOW)).toHaveLength(24);
    expect(buildTimeChips(FUTURE_DATE, 60, [], EARLY_NOW)).toHaveLength(12);
  });

  it('15-min duration uses 30-min intervals, not 15; 90-min uses 60', () => {
    expect(chipIntervalMinutes(15)).toBe(30);
    expect(chipIntervalMinutes(90)).toBe(60);
    expect(buildTimeChips(FUTURE_DATE, 15, [], EARLY_NOW)).toHaveLength(24);
    expect(buildTimeChips(FUTURE_DATE, 90, [], EARLY_NOW)).toHaveLength(12);
  });

  it("flags 'available' and 'booked' times as Added — but NOT 'cancelled' (Bug 1)", () => {
    const at = (hhmm: string) => istLocalToUtcIso(`${FUTURE_DATE}T${hhmm}`) as string;
    const chips = buildTimeChips(FUTURE_DATE, 45, [
      { startAtUtc: at('09:30'), status: 'available' },
      { startAtUtc: at('11:00'), status: 'booked' },
      { startAtUtc: at('12:30'), status: 'cancelled' },
    ], EARLY_NOW);
    expect(chips.find((chip) => chip.istLocal === `${FUTURE_DATE}T09:30`)?.alreadyAdded).toBe(true);
    expect(chips.find((chip) => chip.istLocal === `${FUTURE_DATE}T11:00`)?.alreadyAdded).toBe(true);
    expect(chips.find((chip) => chip.istLocal === `${FUTURE_DATE}T12:30`)?.alreadyAdded).toBe(false);
    expect(chips.filter((chip) => chip.alreadyAdded)).toHaveLength(2);
  });

  it("today's date excludes past times", () => {
    // "Now" = 12:15 PM IST on the grid date → chips at/before 12:15 are gone.
    const now = new Date(istLocalToUtcIso(`${FUTURE_DATE}T12:15`) as string);
    const chips = buildTimeChips(FUTURE_DATE, 60, [], now);
    expect(chips[0].label).toBe('1:00 PM');
    expect(chips).toHaveLength(7); // 13:00..19:00
  });

  it('returns [] for a malformed date', () => {
    expect(buildTimeChips('nonsense', 45, [], EARLY_NOW)).toEqual([]);
  });

  it('round-trips through the IST utility', () => {
    const chips = buildTimeChips(FUTURE_DATE, 60, [], EARLY_NOW);
    expect(utcIsoToIstLocal(chips[0].utcIso)).toBe(chips[0].istLocal);
  });
});

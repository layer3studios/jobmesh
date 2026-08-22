// FILE: src/components/employer/jobs/time-chip-helpers.ts
// Pure chip-grid generation for the add-times picker. Chips run 8:00–20:00 IST
// at an interval derived from the interview duration (15-min interviews use
// 30-min steps — 15 is too dense; 90-min use 60). Past chips (today) are
// excluded entirely; already-pooled chips are kept but flagged so the UI can
// show them disabled as "Added".

import { istLocalToUtcIso } from '../../../utils/ist-datetime';

const GRID_START_HOUR = 8; // 8:00 AM IST
const GRID_END_HOUR = 20; // chips start strictly before 8:00 PM IST

const INTERVAL_BY_DURATION: Record<number, number> = { 15: 30, 30: 30, 45: 45, 60: 60, 90: 60 };

export interface TimeChip {
  /** datetime-local value, IST wall-clock — the selection key. */
  istLocal: string;
  /** UTC instant actually sent to the API. */
  utcIso: string;
  /** 12-hour display, e.g. "9:00 AM", "2:30 PM". */
  label: string;
  /** Already in the pool for this date — rendered disabled as "Added". */
  alreadyAdded: boolean;
  /** Which active status blocks this chip (drives "· added" vs "· booked"). */
  existingStatus: 'available' | 'booked' | null;
}

export function chipIntervalMinutes(durationMinutes: number): number {
  return INTERVAL_BY_DURATION[durationMinutes] ?? 60;
}

function twelveHourLabel(hour24: number, minute: number): string {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
}

export interface ExistingPoolTime { startAtUtc: string; status: string }
/** Only these statuses block a chip — a CANCELLED time is re-addable (Bug 1). */
const BLOCKING_STATUSES = new Set(['available', 'booked']);

/**
 * (date, duration, existing pool times) → chips. `dateIso` is 'YYYY-MM-DD'
 * (an IST calendar day); `existingTimes` may span any dates — only matches on
 * this date flag chips, and only ACTIVE (available/booked) ones do: a
 * cancelled time is not the same as an active one and stays selectable.
 * Chips already in the past (relative to `now`) are excluded from the output.
 */
export function buildTimeChips(
  dateIso: string,
  durationMinutes: number,
  existingTimes: ExistingPoolTime[],
  now: Date = new Date(),
): TimeChip[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return [];
  const intervalMinutes = chipIntervalMinutes(durationMinutes);
  const existing = new Map<number, 'available' | 'booked'>();
  for (const time of existingTimes) {
    if (!BLOCKING_STATUSES.has(time.status)) continue;
    existing.set(new Date(time.startAtUtc).getTime(), time.status as 'available' | 'booked');
  }
  const chips: TimeChip[] = [];

  for (
    let minutesFromMidnight = GRID_START_HOUR * 60;
    minutesFromMidnight < GRID_END_HOUR * 60;
    minutesFromMidnight += intervalMinutes
  ) {
    const hour24 = Math.floor(minutesFromMidnight / 60);
    const minute = minutesFromMidnight % 60;
    const istLocal = `${dateIso}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const utcIso = istLocalToUtcIso(istLocal);
    if (!utcIso) continue;
    if (new Date(utcIso) <= now) continue; // past chips are dropped, not shown
    const existingStatus = existing.get(new Date(utcIso).getTime()) ?? null;
    chips.push({
      istLocal,
      utcIso,
      label: twelveHourLabel(hour24, minute),
      alreadyAdded: existingStatus !== null,
      existingStatus,
    });
  }
  return chips;
}

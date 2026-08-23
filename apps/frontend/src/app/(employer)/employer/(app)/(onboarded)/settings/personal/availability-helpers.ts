// FILE: settings/personal/availability-helpers.ts
// Pure helpers for the weekly interview-availability editor: the time options, the
// presets, and the conversion between the editor's 7-row grid and the sparse array
// the API stores.
//
// The editor always holds SEVEN rows, one per weekday, each with an on/off flag.
// The API stores only the days that are on. Keeping the full week in the UI is what
// lets someone toggle Saturday off and back on without losing the hours they had
// set — the row is still there, just inactive.

/** Server shape: one entry per ACTIVE day. */
export interface AvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
  isActive?: boolean;
}

/** Editor shape: always seven, indexed 0 (Sunday) … 6 (Saturday). */
export interface DayRow {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

/** Monday first — the working week is how people read their own schedule. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

export const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

/**
 * 07:00 → 22:00 in half-hours. Wider than a working day on both sides: the
 * "Extended" preset alone needs 19:00, and an early-shift team needs 07:00.
 */
const FIRST_OPTION_MINUTES = 7 * 60;
const LAST_OPTION_MINUTES = 22 * 60;
const STEP_MINUTES = 30;

export const TIME_OPTIONS: string[] = (() => {
  const options: string[] = [];
  for (let minutes = FIRST_OPTION_MINUTES; minutes <= LAST_OPTION_MINUTES; minutes += STEP_MINUTES) {
    options.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }
  return options;
})();

/** "09:30" → 570. Returns 0 for anything malformed; the server re-validates. */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 0;
}

/** "14:30" → "2:30 pm". Used for the summary line, not the dropdowns. */
export function formatTime(time: string): string {
  const total = minutesOf(time);
  const hours = Math.floor(total / 60);
  const suffix = hours < 12 ? 'am' : 'pm';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(total % 60).padStart(2, '0')} ${suffix}`;
}

/** Indian business hours — the default this product is built around. */
export const DEFAULT_START = '10:00';
export const DEFAULT_END = '17:00';

export type PresetKey = 'business' | 'extended' | 'clear';

/** Mon–Fri on, weekend off, at the given hours. 'clear' turns every day off. */
export function applyPreset(rows: DayRow[], preset: PresetKey): DayRow[] {
  if (preset === 'clear') return rows.map((row) => ({ ...row, isAvailable: false }));
  const [startTime, endTime] = preset === 'extended' ? ['09:00', '19:00'] : [DEFAULT_START, DEFAULT_END];
  return rows.map((row) => ({
    ...row,
    // Weekends stay off: a preset called "business hours" that switched on Saturday
    // would be setting hours the person did not ask for.
    isAvailable: row.dayOfWeek >= 1 && row.dayOfWeek <= 5,
    startTime,
    endTime,
  }));
}

/** Seven rows seeded from whatever the server had; absent days default to off. */
export function buildRows(entries: AvailabilityEntry[]): DayRow[] {
  const byDay = new Map(entries.map((entry) => [entry.dayOfWeek, entry]));
  return WEEKDAY_ORDER.map((dayOfWeek) => {
    const entry = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      isAvailable: Boolean(entry) && entry?.isActive !== false,
      startTime: entry?.startTime ?? DEFAULT_START,
      endTime: entry?.endTime ?? DEFAULT_END,
    };
  });
}

/** Only the days that are on, in server order. Rows with an invalid span are dropped. */
export function toEntries(rows: DayRow[]): AvailabilityEntry[] {
  return rows
    .filter((row) => row.isAvailable && minutesOf(row.endTime) > minutesOf(row.startTime))
    .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/** A row is only saveable when its end is genuinely after its start. */
export function rowError(row: DayRow): string | undefined {
  if (!row.isAvailable) return undefined;
  return minutesOf(row.endTime) > minutesOf(row.startTime) ? undefined : 'End time must be after the start time.';
}

/**
 * Where a row's window sits across the option range, as two percentages.
 * Drives the span bar, which is the one thing in this editor that shows the SHAPE
 * of a week rather than restating the numbers already in the dropdowns.
 */
export function spanPercent(row: DayRow): { left: number; width: number } {
  const total = LAST_OPTION_MINUTES - FIRST_OPTION_MINUTES;
  const start = Math.max(0, minutesOf(row.startTime) - FIRST_OPTION_MINUTES);
  const end = Math.min(total, minutesOf(row.endTime) - FIRST_OPTION_MINUTES);
  return { left: (start / total) * 100, width: Math.max(0, ((end - start) / total) * 100) };
}

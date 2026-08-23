'use client';
// FILE: settings/personal/AvailabilityDayRow.tsx
// One weekday in the availability editor: a switch, two time dropdowns, and a span
// bar.
//
// THE SPAN BAR IS THE ONE NON-OBVIOUS ELEMENT, and it earns its place by showing
// something the dropdowns cannot: the SHAPE of a week. Seven rows of "10:00–17:00"
// read as seven identical strings; seven bars show at a glance that Wednesday is
// short and Friday starts late. It restates no number — it positions them against
// each other, which is the comparison a person actually makes when setting hours.

import { Select, Switch } from '@/components/ui';
import { COPY } from '@/theme/brand';
import {
  TIME_OPTIONS, WEEKDAY_LABELS, WEEKDAY_SHORT, rowError, spanPercent, type DayRow,
} from './availability-helpers';

const TEXT = COPY.employer.availability;

const timeOptions = TIME_OPTIONS.map((time) => ({ value: time, label: time }));

export default function AvailabilityDayRow({ row, disabled, onChange }: {
  row: DayRow;
  disabled: boolean;
  onChange: (next: DayRow) => void;
}) {
  const error = rowError(row);
  const span = spanPercent(row);

  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Fixed width so all seven switches and labels line up into a column
            rather than stepping in and out with the length of the day name. */}
        <div style={{ width: 132, flexShrink: 0 }}>
          <Switch
            checked={row.isAvailable}
            disabled={disabled}
            onChange={(isAvailable) => onChange({ ...row, isAvailable })}
            label={WEEKDAY_LABELS[row.dayOfWeek]}
          />
        </div>

        {row.isAvailable ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Select
              aria-label={`${WEEKDAY_LABELS[row.dayOfWeek]} ${TEXT.startLabel}`}
              value={row.startTime}
              options={timeOptions}
              disabled={disabled}
              onChange={(e) => onChange({ ...row, startTime: e.target.value })}
              style={{ width: 104 }}
            />
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>→</span>
            <Select
              aria-label={`${WEEKDAY_LABELS[row.dayOfWeek]} ${TEXT.endLabel}`}
              value={row.endTime}
              options={timeOptions}
              disabled={disabled}
              onChange={(e) => onChange({ ...row, endTime: e.target.value })}
              style={{ width: 104 }}
            />
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{TEXT.unavailable}</span>
        )}
      </div>

      {/* Hidden from assistive tech: it is a second rendering of the two values
          just above, and announcing it would only repeat them. */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative', height: 3, marginTop: 8, borderRadius: 999,
          background: 'var(--surface-sunken)', overflow: 'hidden',
        }}
      >
        {row.isAvailable && !error && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${span.left}%`, width: `${span.width}%`,
            background: 'var(--accent)', borderRadius: 999,
          }} />
        )}
      </div>

      {error && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--danger)' }}>
          <span className="sr-only">{WEEKDAY_SHORT[row.dayOfWeek]}: </span>{error}
        </p>
      )}
    </div>
  );
}

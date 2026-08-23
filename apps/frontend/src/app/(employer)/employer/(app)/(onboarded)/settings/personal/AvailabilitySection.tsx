'use client';
// FILE: settings/personal/AvailabilitySection.tsx
// "Interview availability" — the seven-day editor on the personal settings page.
//
// AUTO-SAVE, matching NotificationSettings on the same page: a toggle that needs a
// separate Save button is lying about what it just did. The change applies
// optimistically and REVERTS on failure, so the grid never shows hours the server
// disagrees with.
//
// Saves are debounced. Dragging through a time dropdown fires several changes in a
// second, and one PUT per keystroke would race itself — the last write would not
// reliably be the last one to land.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack, useToast } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { fetchAvailability, saveAvailability } from '@/api/employer-me-api';
import { EmployerApiError } from '@/api/employer-api';
import AvailabilityDayRow from './AvailabilityDayRow';
import {
  applyPreset, buildRows, rowError, toEntries, type DayRow, type PresetKey,
} from './availability-helpers';

const TEXT = COPY.employer.availability;
const SAVE_DEBOUNCE_MS = 600;

const PRESETS: Array<{ key: PresetKey; label: string }> = [
  { key: 'business', label: TEXT.presetBusiness },
  { key: 'extended', label: TEXT.presetExtended },
  { key: 'clear', label: TEXT.presetClear },
];

export default function AvailabilitySection() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [hasExplicitTimezone, setHasExplicitTimezone] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The last state the server confirmed, so a failed save can put the grid back.
  const lastSaved = useRef<DayRow[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    fetchAvailability()
      .then((result) => {
        if (!isCurrent) return;
        const next = buildRows(result.availability);
        setRows(next);
        lastSaved.current = next;
        setTimezone(result.timezone);
        setHasExplicitTimezone(result.hasExplicitTimezone);
      })
      .catch(() => { if (isCurrent) setError(TEXT.loadFailed); });
    return () => { isCurrent = false; };
  }, []);

  // Clear any pending save on unmount so a debounced PUT cannot fire into a
  // component that is no longer mounted.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const scheduleSave = useCallback((next: DayRow[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // A day with an impossible span is never sent — the row shows its own error
      // and the rest of the week still saves.
      saveAvailability(toEntries(next))
        .then(() => { lastSaved.current = next; setError(null); })
        .catch((cause) => {
          setError(cause instanceof EmployerApiError ? cause.message : TEXT.saveFailed);
          if (lastSaved.current) setRows(lastSaved.current);
          showToast('error', TEXT.saveFailed);
        });
    }, SAVE_DEBOUNCE_MS);
  }, [showToast]);

  function update(next: DayRow[]) {
    setRows(next);
    scheduleSave(next);
  }

  if (rows === null) {
    return (
      <section>
        <SectionHeading />
        {error ? <Alert type="error">{error}</Alert> : null}
      </section>
    );
  }

  const hasInvalidRow = rows.some((row) => rowError(row) !== undefined);

  return (
    <section>
      <SectionHeading />

      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--ink-faint)' }}>
        {timezone ? TEXT.timezoneNote.replace('{timezone}', timezone) : ''}
      </p>
      {!hasExplicitTimezone && (
        <div style={{ marginBottom: 10 }}>
          <Alert type="warning">{TEXT.timezoneMissing}</Alert>
        </div>
      )}

      <Stack gap={8} dir="row" align="center" wrap>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{TEXT.presetsLabel}</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.key} type="button" variant="secondary" size="sm"
            onClick={() => update(applyPreset(rows, preset.key))}
          >
            {preset.label}
          </Button>
        ))}
      </Stack>

      <div style={{ marginTop: 6 }}>
        {rows.map((row) => (
          <AvailabilityDayRow
            key={row.dayOfWeek}
            row={row}
            disabled={false}
            onChange={(next) => update(rows.map((current) => (
              current.dayOfWeek === next.dayOfWeek ? next : current
            )))}
          />
        ))}
      </div>

      {/* Only surfaced once a row is genuinely unsaveable — the row's own message
          says which day, so this one says what it means for the week. */}
      {hasInvalidRow && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
          Days with an invalid range are not saved.
        </p>
      )}
      {error && <div style={{ marginTop: 10 }}><Alert type="error">{error}</Alert></div>}
    </section>
  );
}

function SectionHeading() {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
        {TEXT.sectionTitle}
      </h2>
      <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
        {TEXT.sectionBody}
      </p>
    </div>
  );
}

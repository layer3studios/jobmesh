'use client';
// FILE: settings/parts/AutoArchiveSettings.tsx
// The auto-archive section of Company settings: a switch, and the number of quiet
// days that triggers it. Off is the default and null is how "off" is stored, so
// the toggle writes null rather than 0 — a 0-day threshold would archive everyone.
//
// The helper text states the thing an employer must know before enabling it: no
// rejection email is sent. That is a promise the backend keeps (auto-archive-stale.js
// never mails), and it belongs next to the switch, not in a docs page.

import { useState } from 'react';
import { Button, Input, Switch, useToast } from '@/components/ui';
import { updateEmployerCompany, EmployerApiError } from '@/api/employer-api';

const MIN_DAYS = 7;
const MAX_DAYS = 90;
const DEFAULT_DAYS = 30;

const LABEL_STYLE = { margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' } as const;
const HELP_STYLE = { margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' } as const;

export default function AutoArchiveSettings({ value, canEdit, onSaved }: {
  /** Current setting from the company record. null means the feature is off. */
  value: number | null;
  canEdit: boolean;
  onSaved: () => Promise<void> | void;
}) {
  const { showToast } = useToast();
  const [isEnabled, setIsEnabled] = useState(value != null);
  const [days, setDays] = useState(String(value ?? DEFAULT_DAYS));
  const [isSaving, setIsSaving] = useState(false);

  const parsed = Number(days);
  const isValid = !isEnabled
    || (Number.isInteger(parsed) && parsed >= MIN_DAYS && parsed <= MAX_DAYS);
  const nextValue = isEnabled ? parsed : null;
  const isDirty = isValid && nextValue !== value;

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateEmployerCompany({ autoArchiveStaleDays: nextValue });
      await onSaved();
      showToast('success', nextValue == null
        ? 'Auto-archive turned off.'
        : `Candidates will be archived after ${nextValue} days of no activity.`);
    } catch (error) {
      showToast('error', error instanceof EmployerApiError ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
        <p style={LABEL_STYLE}>Auto-archive</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
          {value == null
            ? 'Candidates are never archived automatically.'
            : `Candidates with no activity for ${value} days are archived automatically.`}
        </p>
        <p style={HELP_STYLE}>Only a Founder or Owner can change this.</p>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
      <p style={LABEL_STYLE}>Auto-archive</p>
      <Switch
        checked={isEnabled}
        onChange={(checked) => setIsEnabled(checked)}
        label="Auto-archive candidates with no activity"
      />
      {isEnabled && (
        <div style={{ marginTop: 12, maxWidth: 220 }}>
          <p style={LABEL_STYLE}>After this many days of inactivity</p>
          <Input
            type="number" inputMode="numeric"
            aria-label="Days of inactivity before archiving"
            min={MIN_DAYS} max={MAX_DAYS}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          {!isValid && (
            <p style={{ ...HELP_STYLE, color: 'var(--danger)' }}>
              Enter a whole number between {MIN_DAYS} and {MAX_DAYS}.
            </p>
          )}
        </div>
      )}
      <p style={HELP_STYLE}>
        Candidates with no stage movement for this many days are archived automatically.
        No rejection email is sent, and anyone with an interview booked is left alone.
      </p>
      <div style={{ marginTop: 12 }}>
        <Button size="sm" disabled={!isDirty} loading={isSaving} onClick={() => void handleSave()}>
          Save auto-archive
        </Button>
      </div>
    </div>
  );
}

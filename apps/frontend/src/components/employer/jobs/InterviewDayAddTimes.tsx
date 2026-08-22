'use client';
// FILE: src/components/employer/jobs/InterviewDayAddTimes.tsx
// The add-flow: "Add times" heading, per-batch type + detail fields, the chip
// grid, and the footer (count · IST note · Add N).
//
// BACKEND SHAPE: interview_times snapshot their mode / locationText from the
// posting's interviewDefaults, and only meetingUrl is accepted per time. So a
// batch is written in two steps — syncDefaults() first (so the snapshot is
// this batch's type), then the times themselves. Times already created keep
// the snapshot they were written with, which is what makes per-batch types work.

import { useState } from 'react';
import { Button, Stack, useToast } from '@/components/ui';
import { addInterviewTimes, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import { buildTimeChips, type ExistingPoolTime } from './time-chip-helpers';
import TimeChipGrid from './TimeChipGrid';
import AddTimesTypeFields from './AddTimesTypeFields';
import { requiredFieldFilled, type AddTimesForm } from './useAddTimesForm';

const INPUT_STYLE = {
  padding: '6px 9px', border: '0.5px solid var(--border)', borderRadius: 8,
  fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;

export default function InterviewDayAddTimes({
  postingId, dateIso, durationMinutes, durationSaved, form, onFormChange,
  onFormUsed, syncDefaults, existingTimes, onAdded,
}: {
  postingId: string;
  dateIso: string;
  durationMinutes: number;
  /** Defaults exist with a duration — the ONLY thing the gate needs saved. */
  durationSaved: boolean;
  form: AddTimesForm;
  onFormChange: <K extends keyof AddTimesForm>(key: K, value: AddTimesForm[K]) => void;
  onFormUsed: () => void;
  /** Writes this batch's type/detail onto the posting defaults before the POST. */
  syncDefaults: (form: AddTimesForm) => Promise<void>;
  existingTimes: ExistingPoolTime[];
  onAdded: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [busy, setBusy] = useState(false);

  const chips = buildTimeChips(dateIso, durationMinutes, existingTimes);
  const selectedCount = selected.size;
  const detailFilled = requiredFieldFilled(form);
  const canAdd = !busy && durationSaved && selectedCount > 0 && detailFilled;

  function toggle(istLocal: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(istLocal)) next.delete(istLocal); else next.add(istLocal);
      return next;
    });
  }

  function addCustomTime(): void {
    const utcIso = istLocalToUtcIso(customValue);
    if (!utcIso || new Date(utcIso) <= new Date()) {
      showToast('error', 'Pick a future date and time.');
      return;
    }
    toggle(customValue);
    setCustomValue('');
    setCustomOpen(false);
  }

  async function handleAdd(): Promise<void> {
    if (!canAdd) return;
    setBusy(true);
    try {
      await syncDefaults(form);
      const { insertedCount } = await addInterviewTimes(postingId, [...selected].map((value) => ({
        startAtUtc: istLocalToUtcIso(value) as string,
        meetingUrl: form.mode === 'video' ? form.meetingUrl.trim() || null : null,
      })));
      showToast('success', `${insertedCount} time${insertedCount === 1 ? '' : 's'} added.`);
      setSelected(new Set());
      onFormUsed();
      await onAdded();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not add times. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={8}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
        Add times
      </p>
      <AddTimesTypeFields form={form} onChange={onFormChange} />
      <TimeChipGrid chips={chips} selectedIstLocals={selected} onToggle={toggle} />
      {customOpen && (
        <Stack dir="row" gap={8} align="center">
          <input type="datetime-local" aria-label="Custom time" value={customValue} style={INPUT_STYLE} onChange={(event) => setCustomValue(event.target.value)} />
          <Button variant="ghost" size="sm" onClick={addCustomTime}>Add to selection</Button>
        </Stack>
      )}
      {!durationSaved && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-muted)' }}>
          Set a default duration to start adding times.
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {selectedCount} time{selectedCount === 1 ? '' : 's'} selected
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Times in IST</span>
        <span style={{ flex: 1 }} />
        {!customOpen && <Button variant="link" size="sm" onClick={() => setCustomOpen(true)}>Custom time</Button>}
        <Button size="sm" loading={busy} disabled={!canAdd} onClick={() => void handleAdd()}>
          Add {selectedCount > 0 ? selectedCount : ''} time{selectedCount === 1 ? '' : 's'}
        </Button>
      </div>
    </Stack>
  );
}

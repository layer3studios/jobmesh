'use client';
// FILE: src/components/employer/jobs/InterviewDetailsForm.tsx
// The slim left sidebar: duration only. Interview TYPE and its detail field
// (link / phone / address) moved into the add-times panel, because those are
// chosen per batch of times — one date can be a video screen and the next a
// phone call. Saving here writes just the duration onto the posting defaults.

import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { updateInterviewDefaults, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewDefaults } from '@/types/employer-interviews';

const DURATION_OPTIONS = [30, 45, 60, 90];
const LABEL_STYLE = { margin: '0 0 6px', fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-2)' } as const;

function PillToggle({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onSelect}
      style={{
        padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
        border: selected ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
        background: selected ? 'var(--accent)' : 'transparent',
        color: selected ? 'var(--text-on-accent)' : 'var(--ink)',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

export default function InterviewDetailsForm({
  postingId, initialDefaults, onSaved,
}: {
  postingId: string;
  initialDefaults: InterviewDefaults | null;
  onSaved: (defaults: InterviewDefaults) => void;
}) {
  const { showToast } = useToast();
  const [durationMinutes, setDurationMinutes] = useState(initialDefaults?.durationMinutes ?? 45);
  const [saving, setSaving] = useState(false);

  async function handleSave(): Promise<void> {
    if (saving) return;
    setSaving(true);
    try {
      // Carry existing type/detail through untouched — the add panel owns them.
      const defaults: InterviewDefaults = {
        mode: initialDefaults?.mode ?? 'video',
        meetingUrl: initialDefaults?.meetingUrl ?? null,
        locationText: initialDefaults?.locationText ?? null,
        phoneNumber: initialDefaults?.phoneNumber ?? null,
        phoneCallDirection: initialDefaults?.phoneCallDirection ?? null,
        arrivalInstructions: initialDefaults?.arrivalInstructions ?? null,
        durationMinutes,
        timezoneId: 'Asia/Kolkata',
      };
      await updateInterviewDefaults(postingId, defaults);
      showToast('success', 'Defaults saved');
      onSaved(defaults);
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Defaults</p>

      <p style={LABEL_STYLE}>Duration</p>
      <div role="group" aria-label="Interview duration" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DURATION_OPTIONS.map((minutes) => (
          <PillToggle key={minutes} label={`${minutes}m`} selected={durationMinutes === minutes} onSelect={() => setDurationMinutes(minutes)} />
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <Button size="sm" fullWidth loading={saving} disabled={saving} onClick={() => void handleSave()}>Save</Button>
      </div>
    </div>
  );
}

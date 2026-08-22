'use client';
// FILE: src/components/employer/jobs/AddTimesTypeFields.tsx
// Type pills + the one detail field that type needs, inside the add-times
// area. Type is chosen PER BATCH here (not on the posting defaults), so
// Monday's times can be video and Wednesday's a phone screen.

import { Video, Phone, Building2 } from 'lucide-react';
import type { InterviewMode, PhoneCallDirection } from '@/types/employer-interviews';
import type { AddTimesForm } from './useAddTimesForm';

const INPUT_STYLE = {
  width: '100%', padding: '5px 8px', border: '0.5px solid var(--border)', borderRadius: 8,
  fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)', boxSizing: 'border-box' as const,
};
const LABEL_STYLE = { display: 'block', fontSize: 11, color: 'var(--ink-2)', marginBottom: 3 } as const;

const MODE_PILLS: { value: InterviewMode; label: string; Icon: typeof Video }[] = [
  { value: 'video', label: 'Video', Icon: Video },
  { value: 'phone', label: 'Phone', Icon: Phone },
  { value: 'in_person', label: 'In person', Icon: Building2 },
];
const DIRECTION_PILLS: { value: PhoneCallDirection; label: string }[] = [
  { value: 'we_call', label: 'We call' }, { value: 'candidate_calls', label: 'Candidate calls' },
];

function Pill({ label, selected, onSelect, children }: {
  label: string; selected: boolean; onSelect: () => void; children?: React.ReactNode;
}) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onSelect} className="icon-btn"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
        fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
        border: `0.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent)' : 'transparent',
        color: selected ? 'var(--text-on-accent)' : 'var(--ink-2)',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {children}{label}
    </button>
  );
}

export default function AddTimesTypeFields({ form, onChange }: {
  form: AddTimesForm;
  onChange: <K extends keyof AddTimesForm>(key: K, value: AddTimesForm[K]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div role="group" aria-label="Interview type" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {MODE_PILLS.map(({ value, label, Icon }) => (
          <Pill key={value} label={label} selected={form.mode === value} onSelect={() => onChange('mode', value)}>
            <Icon size={11} />
          </Pill>
        ))}
      </div>

      {form.mode === 'video' && (
        <label>
          <span style={LABEL_STYLE}>Meeting link</span>
          <input
            type="url" aria-label="Meeting link" value={form.meetingUrl} style={INPUT_STYLE}
            placeholder="https://meet.google.com/abc-defg-hij"
            onChange={(event) => onChange('meetingUrl', event.target.value)}
          />
        </label>
      )}

      {form.mode === 'phone' && (
        <>
          <label>
            <span style={LABEL_STYLE}>Phone number</span>
            <input
              type="tel" aria-label="Phone number" value={form.phoneNumber} style={INPUT_STYLE}
              onChange={(event) => onChange('phoneNumber', event.target.value)}
            />
          </label>
          <div role="group" aria-label="Who calls whom" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {DIRECTION_PILLS.map(({ value, label }) => (
              <Pill
                key={value} label={label} selected={form.phoneCallDirection === value}
                onSelect={() => onChange('phoneCallDirection', value)}
              />
            ))}
          </div>
        </>
      )}

      {form.mode === 'in_person' && (
        <>
          <label>
            <span style={LABEL_STYLE}>Address</span>
            <textarea
              aria-label="Address" value={form.address} rows={2} style={INPUT_STYLE}
              onChange={(event) => onChange('address', event.target.value)}
            />
          </label>
          <label>
            <span style={LABEL_STYLE}>Arrival instructions (optional)</span>
            <textarea
              aria-label="Arrival instructions" value={form.arrivalInstructions} rows={2} style={INPUT_STYLE}
              placeholder="Floor, ask for whom at reception, parking, etc."
              onChange={(event) => onChange('arrivalInstructions', event.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}

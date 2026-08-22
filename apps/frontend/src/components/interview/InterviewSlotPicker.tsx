'use client';
// FILE: src/components/interview/InterviewSlotPicker.tsx
// The slot radiogroup: large tappable cards (≥56px) over real native radio
// inputs, so keyboard arrow-keys and screen readers work for free. Selection is
// conveyed by border + background + a check mark, never colour alone.

import type { PublicInterviewSlot } from '../../types/public-interview';
import { formatInterviewTime } from '../../utils/format-interview-time';

const GROUP_LABEL = 'Choose a time that works for you';

export default function InterviewSlotPicker({
  slots, selectedIndex, onSelect, slotErrorIndex, slotErrorMessage,
}: {
  slots: PublicInterviewSlot[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  slotErrorIndex: number | null;
  slotErrorMessage: string | null;
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 12, padding: 0 }}>
        {GROUP_LABEL}
      </legend>
      <div role="none" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slots.map((slot, index) => {
          const selected = selectedIndex === index;
          const hasError = slotErrorIndex === index && slotErrorMessage;
          return (
            <div key={index}>
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 56,
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: selected ? 'var(--surface-sunken)' : 'var(--surface-raised)',
                }}
              >
                <input
                  type="radio"
                  name="interview-slot"
                  value={index}
                  checked={selected}
                  onChange={() => onSelect(index)}
                  aria-describedby={hasError ? `slot-error-${index}` : undefined}
                  style={{ width: 18, height: 18, margin: 0, flexShrink: 0, accentColor: 'var(--accent)' }}
                />
                <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: selected ? 700 : 500, color: 'var(--ink)' }}>
                  {formatInterviewTime(slot.startAtUtc)}
                </span>
                {selected && <span aria-hidden="true" style={{ fontWeight: 700, color: 'var(--accent)' }}>✓</span>}
              </label>
              {hasError && (
                <p id={`slot-error-${index}`} role="alert" style={{ margin: '6px 2px 0', fontSize: '0.82rem', color: 'var(--danger)' }}>
                  {slotErrorMessage}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
        All times are shown in India Standard Time (IST).
      </p>
    </fieldset>
  );
}

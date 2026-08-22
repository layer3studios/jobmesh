'use client';
// FILE: src/components/employer/jobs/parts/ScoreSelector.tsx
// The 1–5 score control.
//
// Built as a radiogroup of five buttons rather than a <select>, because the anchor
// line has to react to HOVER as well as selection: a reviewer deciding between 3 and
// 4 should be able to read what 4 means without committing to it. A native select
// cannot do that, and unlabelled stars are exactly the inconsistency the anchors
// exist to remove.
//
// The five lines are NOT all rendered permanently. Five descriptions stacked under a
// control is more chrome than the rest of the form put together, and a reviewer past
// their first review does not re-read them. One line for the current value, and a
// "?" popover holding the full scale for whoever wants it.

import { useState } from 'react';
import { TYPE } from '@/theme/tokens';
import { SCORE_ANCHORS, formatAnchorLine } from './review-helpers';

interface Props {
  value: number | null;
  disabled?: boolean;
  onChange: (score: number) => void;
}

export default function ScoreSelector({ value, disabled, onChange }: Props) {
  // What the anchor line is describing right now: the hovered/focused option if
  // there is one, otherwise the committed value.
  const [preview, setPreview] = useState<number | null>(null);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const shown = preview ?? value;

  // Arrow keys move between options, matching the native radiogroup contract that
  // the roving-tabindex pattern below sets up.
  const handleKeyDown = (event: React.KeyboardEvent, current: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = Math.min(SCORE_ANCHORS.length, Math.max(1, current + delta));
    onChange(next);
    setPreview(next);
    document.getElementById(`score-option-${next}`)?.focus();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)' }}>Overall score</span>
        <button
          type="button"
          aria-label="What the scores mean"
          aria-expanded={isScaleOpen}
          onClick={() => setIsScaleOpen((open) => !open)}
          style={{
            width: 18, height: 18, borderRadius: '50%', border: '1px solid var(--border-strong)',
            background: 'transparent', color: 'var(--ink-muted)', fontSize: '0.7rem',
            cursor: 'pointer', lineHeight: 1, padding: 0,
          }}
        >
          ?
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Overall score"
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        onMouseLeave={() => setPreview(null)}
      >
        {SCORE_ANCHORS.map((anchor) => {
          const isSelected = value === anchor.value;
          return (
            <button
              key={anchor.value}
              id={`score-option-${anchor.value}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${anchor.value} — ${anchor.label}`}
              disabled={disabled}
              // Roving tabindex: the group is one tab stop, arrows move within it.
              tabIndex={isSelected || (value === null && anchor.value === 1) ? 0 : -1}
              onClick={() => onChange(anchor.value)}
              onKeyDown={(event) => handleKeyDown(event, anchor.value)}
              onMouseEnter={() => setPreview(anchor.value)}
              onFocus={() => setPreview(anchor.value)}
              onBlur={() => setPreview(null)}
              style={{
                minWidth: 44, padding: '8px 12px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: TYPE.base, fontWeight: 600,
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                color: isSelected ? 'var(--accent)' : 'var(--ink)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {anchor.value}
            </button>
          );
        })}
      </div>

      {/* One line, reacting to hover and focus as well as selection. */}
      <p
        role="status"
        style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: '6px 0 0', minHeight: 18, lineHeight: 1.5 }}
      >
        {formatAnchorLine(shown) ?? 'Pick a score from 1 to 5.'}
      </p>

      {isScaleOpen && (
        <ul
          style={{
            listStyle: 'none', margin: '8px 0 0', padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          {SCORE_ANCHORS.map((anchor) => (
            <li key={anchor.value} style={{ fontSize: TYPE.xs, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>{`${anchor.value} ${anchor.label}`}</strong>
              {` — ${anchor.description}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

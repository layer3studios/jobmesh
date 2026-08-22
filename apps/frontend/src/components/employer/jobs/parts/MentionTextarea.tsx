'use client';
// FILE: src/components/employer/jobs/parts/MentionTextarea.tsx
// A note composer that understands "@".
//
// The dropdown is anchored to the composer, not to the caret. A caret-following
// popover needs a mirrored div to measure text, and inside a 360px sidebar it spends
// most of its life clamped against an edge anyway — anchoring under the field puts
// the list in the same place every time, which is easier to aim at than a list that
// moves as you type.
//
// While the list is open it owns ↑/↓/Enter/Escape; every other key, and every key at
// all when it is closed, belongs to the textarea. Cmd/Ctrl+Enter still submits.

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui';
import {
  findActiveMentionQuery, filterMentionCandidates, insertMention, pruneMentions,
  type MentionCandidate,
} from './mention-helpers';

const LIST_STYLE = {
  position: 'absolute' as const, top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
  margin: 0, padding: 4, listStyle: 'none', maxHeight: 200, overflowY: 'auto' as const,
  background: 'var(--surface-raised)', border: '1px solid var(--border)',
  borderRadius: 8, boxShadow: 'var(--shadow-sm)',
};
const INITIALS_STYLE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 22, height: 22, borderRadius: 999, flexShrink: 0,
  fontSize: 10, fontWeight: 700, background: 'var(--accent-soft)', color: 'var(--accent)',
};

/** "Priya Raman" → "PR". Falls back to one letter for a single-word name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').concat(parts.length > 1 ? parts[parts.length - 1][0] : '').toUpperCase();
}

export default function MentionTextarea({
  label, value, rows = 3, disabled, candidates, mentionedUserIds,
  onChange, onSubmit,
}: {
  label: string;
  value: string;
  rows?: number;
  disabled?: boolean;
  /** Empty for a solo founder — the feature then never shows itself at all. */
  candidates: MentionCandidate[];
  mentionedUserIds: string[];
  onChange: (next: { body: string; mentionedUserIds: string[] }) => void;
  onSubmit: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<ReturnType<typeof findActiveMentionQuery>>(null);
  const [highlighted, setHighlighted] = useState(0);
  // Set when a mention is inserted, applied after the value round-trips through the
  // parent — setting selectionStart before React repaints would be overwritten.
  const pendingCaret = useRef<number | null>(null);

  const suggestions = query ? filterMentionCandidates(candidates, query.query) : [];
  const isOpen = query !== null && suggestions.length > 0;

  useEffect(() => {
    if (pendingCaret.current == null || !textareaRef.current) return;
    textareaRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    textareaRef.current.focus();
    pendingCaret.current = null;
  }, [value]);

  useEffect(() => { setHighlighted(0); }, [query?.query, query?.start]);

  /** Every edit re-derives the mention list from the text (see mention-helpers). */
  function emit(body: string, ids: string[]) {
    onChange({ body, mentionedUserIds: pruneMentions(body, ids, candidates) });
  }

  function handleChange(nextValue: string, caret: number) {
    setQuery(candidates.length > 0 ? findActiveMentionQuery(nextValue, caret) : null);
    emit(nextValue, mentionedUserIds);
  }

  function choose(candidate: MentionCandidate) {
    if (!query) return;
    const next = insertMention(value, query, candidate);
    pendingCaret.current = next.caret;
    setQuery(null);
    emit(next.text, [...mentionedUserIds, candidate.employerUserId]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        choose(suggestions[highlighted]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setQuery(null);
        return;
      }
    }
    // Cmd/Ctrl+Enter submits; a bare Enter stays a newline — notes are multi-line.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Textarea
        ref={textareaRef}
        label={label}
        rows={rows}
        value={value}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="mention-suggestions"
        onChange={(event) => handleChange(event.target.value, event.target.selectionStart ?? event.target.value.length)}
        onKeyDown={handleKeyDown}
        // Closing on blur would eat the click that selects an item, so the list
        // closes on mousedown-select instead (choose() clears the query).
        onBlur={() => window.setTimeout(() => setQuery(null), 120)}
      />
      {isOpen && (
        <ul id="mention-suggestions" role="listbox" style={LIST_STYLE}>
          {suggestions.map((candidate, index) => (
            <li key={candidate.employerUserId} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseDown={(event) => { event.preventDefault(); choose(candidate); }}
                onMouseEnter={() => setHighlighted(index)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontSize: '0.82rem', color: 'var(--ink)',
                  background: index === highlighted ? 'var(--surface-sunken)' : 'transparent',
                }}
              >
                <span style={INITIALS_STYLE} aria-hidden="true">{initialsOf(candidate.name)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {candidate.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';
// FILE: src/components/employer/jobs/TagPill.tsx
// One candidate tag, rendered as a soft pill. Colour is a pure function of the tag
// NAME, so "referral" is the same colour on the ranked row, the detail sidebar and
// anywhere else it appears — a recruiter learns the colour, not just the word.
//
// The palette is six --tag-*-bg grounds paired with their --cat-* label hues, both
// defined per theme, so pills stay legible in light and dark without a JS branch.

const PALETTE = [
  { background: 'var(--tag-1-bg)', color: 'var(--cat-green)' },
  { background: 'var(--tag-2-bg)', color: 'var(--cat-blue)' },
  { background: 'var(--tag-3-bg)', color: 'var(--cat-amber)' },
  { background: 'var(--tag-4-bg)', color: 'var(--cat-purple)' },
  { background: 'var(--tag-5-bg)', color: 'var(--cat-indigo)' },
  { background: 'var(--tag-6-bg)', color: 'var(--cat-orange)' },
] as const;

/** Stable small hash (djb2) — the same name always lands on the same swatch. */
export function tagColorIndex(name: string): number {
  let hash = 5381;
  for (let index = 0; index < name.length; index += 1) {
    hash = ((hash << 5) + hash + name.charCodeAt(index)) >>> 0;
  }
  return hash % PALETTE.length;
}

export function tagColors(name: string) {
  return PALETTE[tagColorIndex(name)];
}

export default function TagPill({ name, onRemove, size = 'md' }: {
  name: string;
  /** Omit for a read-only pill (ranked rows). Present renders the × control. */
  onRemove?: (name: string) => void;
  size?: 'sm' | 'md';
}) {
  const { background, color } = tagColors(name);
  const compact = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: compact ? '1px 7px' : '3px 4px 3px 9px',
        borderRadius: 999, background, color,
        fontSize: compact ? 11 : 12, fontWeight: 600, lineHeight: 1.5,
        maxWidth: compact ? 110 : 180,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${name}`}
          onClick={(event) => { event.stopPropagation(); onRemove(name); }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: 999, flexShrink: 0,
            border: 'none', background: 'transparent', color: 'inherit',
            cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

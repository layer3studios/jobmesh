'use client';
// FILE: src/components/employer/jobs/parts/NoteBody.tsx
// A saved note's text, with @mentions lifted out of the prose.
//
// The highlight is the whole point: a note is a wall of small grey text, and a
// mention is the one thing in it addressed to a specific person. Tinted ground plus
// a slightly heavier weight is enough — a mention is a name, not a link, and there
// is nothing on the other side of it to click.

import type { CSSProperties } from 'react';
import { splitNoteBody, type MentionCandidate } from './mention-helpers';

const MENTION_STYLE: CSSProperties = {
  fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-soft)',
  borderRadius: 3, padding: '0 3px',
};

export default function NoteBody({
  body, style, candidates,
}: {
  body: string;
  style?: CSSProperties;
  /** Current teammates. A name missing from this list renders as plain text —
   *  someone who left the company keeps their mention in the record, unhighlighted. */
  candidates: MentionCandidate[];
}) {
  const segments = splitNoteBody(body, candidates);
  return (
    <p style={style}>
      {segments.map((segment, index) => (
        segment.isMention
          ? <span key={index} style={MENTION_STYLE}>{segment.text}</span>
          : <span key={index}>{segment.text}</span>
      ))}
    </p>
  );
}

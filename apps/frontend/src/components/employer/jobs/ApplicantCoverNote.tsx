'use client';
// FILE: src/components/employer/jobs/ApplicantCoverNote.tsx
// Candidate's cover note, shown on the applicant detail sidebar. Candidate-voiced
// context the AI summary can't replace (R1): muted + italic to read as a quote,
// pre-wrap so the line breaks they typed survive (R4). Callers render this only
// when the note is a non-empty string — no empty-state placeholder (R3).

import { Card, Stack } from '@/components/ui';

// Matches ApplicantReviewPanel's SectionLabel so "Cover note" reads as a sibling of
// the "Skills"/"Summary" labels right below it. Spacing is owned by the caller, not here.
const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
const NOTE_STYLE = {
  margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--ink-2)',
  fontStyle: 'italic' as const, whiteSpace: 'pre-wrap' as const,
};

export default function ApplicantCoverNote({ coverNote }: { coverNote: string }) {
  return (
    <Card>
      <Stack gap={8}>
        <div style={LABEL_STYLE}>Cover note</div>
        <p style={NOTE_STYLE}>&ldquo;{coverNote}&rdquo;</p>
      </Stack>
    </Card>
  );
}

'use client';
// FILE: src/components/employer/jobs/ApplicantNotesCard.tsx
// Employer notes on one applicant, at the bottom of the detail sidebar (C3/D11). Owns
// its own list state and fetches on mount (D8) so the detail response stays lean.
// Append-only: notes render newest first with the author snapshot + relative time, and
// there is no edit or delete affordance because the API offers neither.
//
// On a successful save the returned note is prepended to the list (R5) — no refetch, no
// toast; the note appearing IS the confirmation. On failure the textarea keeps its
// content so a rejected note is never lost.

import { useCallback, useEffect, useState } from 'react';
import { Card, Stack, Button, Alert, SkeletonCard } from '@/components/ui';
import { useParams } from 'next/navigation';
import { listApplicantNotes, createApplicantNote, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import { listMembers } from '@/api/employer-team-api';
import type { ApplicantNote } from '@/types/employer-applicants';
import { formatRelativeTime } from './applicant-view-helpers';
import { useEmployer } from '@/context/employer/EmployerContext';
import { trackEvent } from '@/lib/analytics-events';
import MentionTextarea from './parts/MentionTextarea';
import NoteBody from './parts/NoteBody';
import type { MentionCandidate } from './parts/mention-helpers';
import { COPY } from '@/theme/brand';

type LoadState = 'loading' | 'loaded' | 'error';

// Mirrors the server cap (C7) so the counter and the disabled state agree with the API.
const MAXIMUM_NOTE_LENGTH = 4000;
// Warn before the hard stop rather than only at it — the user can still trim in time.
const COUNTER_WARNING_LENGTH = 3800;
const LOAD_ERROR_MESSAGE = 'Could not load notes.';
const SAVE_ERROR_MESSAGE = 'Could not save this note.';

const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
const BODY_STYLE = {
  margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--ink-2)',
  whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
};
const META_STYLE = { fontSize: '0.72rem', color: 'var(--ink-faint)' };
const EMPTY_STYLE = { fontSize: '0.82rem', color: 'var(--ink-faint)' };
const NOTE_STYLE = { paddingBottom: 12, borderBottom: '1px solid var(--border)' };

/** Counter colour: neutral, then amber approaching the cap, then danger past it. */
function counterColor(length: number): string {
  if (length > MAXIMUM_NOTE_LENGTH) return 'var(--danger)';
  if (length >= COUNTER_WARNING_LENGTH) return 'var(--warning)';
  return 'var(--ink-faint)';
}

/** Who wrote it: the snapshot name, falling back to the snapshot email (D9). */
function authorLabel(note: ApplicantNote): string {
  return note.authorName?.trim() || note.authorEmail;
}

function NoteRow({ note, isLast, candidates }: {
  note: ApplicantNote; isLast: boolean; candidates: MentionCandidate[];
}) {
  return (
    <div style={isLast ? undefined : NOTE_STYLE}>
      <Stack gap={6}>
        <NoteBody body={note.body} style={BODY_STYLE} candidates={candidates} />
        <div style={META_STYLE}>
          {authorLabel(note)} · {formatRelativeTime(note.createdAt)}
        </div>
      </Stack>
    </div>
  );
}

export default function ApplicantNotesCard({ applicationId }: { applicationId: string }) {
  const [notes, setNotes] = useState<ApplicantNote[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [draft, setDraft] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  // Teammates who can be @mentioned. A solo founder gets an empty list and the
  // whole feature stays invisible — no dropdown, no hint, nothing to dismiss.
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const params = useParams<{ postingId: string }>();
  const postingId = typeof params.postingId === 'string' ? params.postingId : '';
  const { company } = useEmployer();

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setNotes(await listApplicantNotes(applicationId));
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }, [applicationId]);

  useEffect(() => { void load(); }, [load]);

  // Roster fetched alongside the notes: it drives both the @picker and the mention
  // highlighting in saved notes. A failure degrades to "no mentions available" —
  // notes still read and still save, just without the affordance.
  useEffect(() => {
    let isActive = true;
    listMembers()
      .then((members) => {
        if (!isActive) return;
        setCandidates(members
          .filter((member) => member.name)
          .map((member) => ({ employerUserId: member.employerUserId, name: member.name as string })));
      })
      .catch(() => { /* mentions are additive — never block the notes card on this */ });
    return () => { isActive = false; };
  }, []);

  // The server trims before measuring (C7), so the counter and the gate measure the
  // trimmed length too — otherwise trailing whitespace would read as over the cap.
  const trimmedLength = draft.trim().length;
  const canSave = trimmedLength > 0 && trimmedLength <= MAXIMUM_NOTE_LENGTH && !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const noteLength = draft.trim().length;
      const created = await createApplicantNote(applicationId, {
        body: draft.trim(), mentionedUserIds,
      });
      trackEvent('note_added', { applicationId, postingId, companyId: company?.id ?? undefined, noteLength });
      setNotes((current) => [created, ...current]); // confirmed append (R5) — server shape, not a guess
      setDraft('');
      setMentionedUserIds([]);
    } catch (error) {
      // Keep the draft: the user's words are the one thing we must not drop (R5).
      setSaveError(error instanceof EmployerApplicantsApiError ? error.message : SAVE_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, canSave, draft, mentionedUserIds, postingId, company?.id]);

  function renderList() {
    if (loadState === 'loading') return <SkeletonCard lines={3} />;
    if (loadState === 'error') {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{LOAD_ERROR_MESSAGE}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        </Alert>
      );
    }
    // Muted line, not an EmptyState CTA — the composer below already is the call to action (D9).
    if (notes.length === 0) return <div style={EMPTY_STYLE}>No notes yet</div>;
    return (
      <Stack gap={12}>
        {notes.map((note, index) => (
          <NoteRow key={note.id} note={note} isLast={index === notes.length - 1} candidates={candidates} />
        ))}
      </Stack>
    );
  }

  return (
    // data-ph-mask: free-text notes may contain personal data — masked in replay.
    <div data-ph-mask style={{ display: 'contents' }}>
    <Card>
      <Stack gap={12}>
        <div style={LABEL_STYLE}>Notes</div>
        {renderList()}
        <Stack gap={8}>
          <MentionTextarea
            label={COPY.employer.applicants.addNote}
            rows={3}
            value={draft}
            disabled={isSaving}
            candidates={candidates}
            mentionedUserIds={mentionedUserIds}
            onChange={({ body, mentionedUserIds: next }) => { setDraft(body); setMentionedUserIds(next); }}
            onSubmit={() => void handleSave()}
          />
          {saveError && <Alert type="error">{saveError}</Alert>}
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span style={{ ...META_STYLE, color: counterColor(trimmedLength) }}>
              {trimmedLength} / {MAXIMUM_NOTE_LENGTH}
            </span>
            <Button size="sm" disabled={!canSave} onClick={() => void handleSave()}>
              {isSaving ? 'Saving…' : 'Save Note'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Card>
    </div>
  );
}

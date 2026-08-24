'use client';
// FILE: src/components/employer/jobs/DiscoverTab.tsx
// The Discover tab: candidates this posting could approach, drawn from people who
// already told THIS company they were open to future roles.
//
// THE EMPTY STATE IS THE IMPORTANT ONE. Most postings will have no suggestions at
// first, and the reason matters — no extracted requirements, or nobody who
// consented yet. A generic "nothing here" would read as broken, so the copy says
// which it is and what would change it.
//
// Reviews are fetched per card as it scrolls into view (see DiscoverCandidateCard),
// so this component only merges the answers back into its list.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, EmptyState, SkeletonCard, Stack, useToast } from '@/components/ui';
import {
  fetchDiscoverCandidates, reviewDiscoverCandidate, addDiscoverCandidateToPipeline,
  EmployerApplicantsApiError,
} from '@/api/employer-discover-api';
import type { DiscoverCandidate } from '@/types/employer-discover';
import DiscoverCandidateCard from './parts/DiscoverCandidateCard';

const LOAD_ERROR = 'Could not load suggestions.';

export default function DiscoverTab({ postingId }: { postingId: string }) {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [error, setError] = useState(LOAD_ERROR);
  const [addingId, setAddingId] = useState<string | null>(null);
  // Guards against a second request for the same card when React re-runs effects
  // (StrictMode in dev remounts every effect once).
  const reviewed = useRef<Set<string>>(new Set());

  const load = useCallback(async (refresh = false) => {
    setLoadState('loading');
    try {
      setCandidates(await fetchDiscoverCandidates(postingId, { refresh }));
      setLoadState('loaded');
    } catch (caught) {
      setError(caught instanceof EmployerApplicantsApiError ? caught.message : LOAD_ERROR);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void load(); }, [load]);

  const handleRequestReview = useCallback(async (seekerUserId: string) => {
    if (reviewed.current.has(seekerUserId)) return;
    reviewed.current.add(seekerUserId);
    try {
      const result = await reviewDiscoverCandidate(postingId, seekerUserId);
      setCandidates((rows) => rows.map((row) => (
        row.seekerUserId === seekerUserId
          ? { ...row, aiReview: result.review, aiRating: result.rating }
          : row
      )));
    } catch {
      // Silent by design: a missing summary is a smaller loss than a toast for
      // every card, and the rest of the card is still worth reading.
    }
  }, [postingId]);

  const handleAdd = useCallback(async (seekerUserId: string) => {
    setAddingId(seekerUserId);
    try {
      const { notified } = await addDiscoverCandidateToPipeline(postingId, seekerUserId);
      setCandidates((rows) => rows.map((row) => (
        row.seekerUserId === seekerUserId ? { ...row, addedToPipeline: true } : row
      )));
      // Whether the candidate was emailed is part of what just happened, so it is
      // said out loud rather than assumed.
      showToast('success', notified
        ? 'Added to pipeline — candidate notified.'
        : 'Added to pipeline. The notification email could not be sent.');
    } catch (caught) {
      showToast('error', caught instanceof EmployerApplicantsApiError
        ? caught.message
        : 'Could not add this candidate.');
    } finally {
      setAddingId(null);
    }
  }, [postingId, showToast]);

  if (loadState === 'loading' && candidates.length === 0) return <SkeletonCard lines={4} />;

  if (loadState === 'error') {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </Stack>
      </Alert>
    );
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No suggestions yet"
        description={
          'Discover surfaces people who applied to your company before and ticked'
          + ' "open to future roles". As more candidates apply — and once this'
          + " posting's requirements have been analysed — matches will appear here."
        }
      />
    );
  }

  return (
    <Stack gap={12}>
      <Stack gap={10} dir="row" align="center" wrap>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'} who agreed to
          hear about future roles at your company.
        </p>
        <span style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" onClick={() => void load(true)}>Refresh</Button>
      </Stack>

      <div className="dv-grid">
        {candidates.map((candidate) => (
          <DiscoverCandidateCard
            key={candidate.seekerUserId}
            candidate={candidate}
            onRequestReview={handleRequestReview}
            onAdd={handleAdd}
            isAdding={addingId === candidate.seekerUserId}
          />
        ))}
      </div>

      {/* Said once, at the foot of the list, rather than on every card: it is a
          property of the whole feature, not of any one person on it. */}
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
        Adding someone here creates an application and emails them about this role.
        Summaries are AI-generated from public profile data — read the resume before deciding.
      </p>
    </Stack>
  );
}

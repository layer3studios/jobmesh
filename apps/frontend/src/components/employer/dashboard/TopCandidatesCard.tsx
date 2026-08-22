'use client';
// FILE: src/components/employer/dashboard/TopCandidatesCard.tsx
// "Top candidates" card. The summary payload carries postingTitle but not
// postingId, so the applicant-detail URL is derived by matching postingTitle
// against the activeJobs array; when the title is missing or ambiguous
// (duplicate titles) the row falls back to the posting's Ranked tab, and with
// no match at all it goes to the jobs list.

import { useRouter } from 'next/navigation';
import { getScoreBadgeStyle, getInitials } from '@/components/employer/jobs/score-badge-helpers';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';
import type { DashboardActiveJob, DashboardTopCandidate } from '@/types/employer-dashboard';
import { DashboardCard } from './DashboardCard';

/** Title → posting id, only when exactly one active job carries that title. */
export function resolvePostingIdByTitle(jobs: DashboardActiveJob[], title: string | null): string | null {
  if (!title) return null;
  const matches = jobs.filter((job) => job.title === title);
  return matches.length === 1 ? matches[0].id : null;
}

export default function TopCandidatesCard({ candidates, jobs }: {
  candidates: DashboardTopCandidate[];
  jobs: DashboardActiveJob[];
}) {
  const router = useRouter();
  const firstJobId = jobs[0]?.id ?? null;

  const openCandidate = (candidate: DashboardTopCandidate) => {
    const postingId = resolvePostingIdByTitle(jobs, candidate.postingTitle);
    if (postingId) {
      router.push(withOrigin(`/employer/jobs/${postingId}/applicants/${candidate.applicationId}`, NAV_ORIGINS.DASHBOARD));
      return;
    }
    router.push(firstJobId
      ? withOrigin(`/employer/jobs/${firstJobId}?tab=ranked`, NAV_ORIGINS.DASHBOARD)
      : '/employer/jobs');
  };

  return (
    <DashboardCard
      title="Top candidates"
      action={firstJobId ? { label: 'View ranked', href: `/employer/jobs/${firstJobId}?tab=ranked` } : undefined}
    >
      {candidates.length === 0 ? (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)' }}>No applicants yet.</p>
      ) : candidates.map((candidate) => {
        const badge = getScoreBadgeStyle(candidate.score);
        return (
          <div
            key={candidate.applicationId}
            data-testid="top-candidate-row"
            onClick={() => openCandidate(candidate)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              borderBottom: '0.5px solid var(--border)', cursor: 'pointer',
            }}
          >
            <span aria-hidden style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600,
              background: badge.background, color: badge.color,
            }}>
              {getInitials(candidate.contactName)}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {candidate.contactName ?? candidate.contactEmail ?? 'Unknown'}
              </span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-faint)' }}>
                {[candidate.postingTitle, candidate.stage].filter(Boolean).join(' · ') || '—'}
              </span>
            </span>
            <span data-testid="score-pill" style={{
              fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
              background: badge.background, color: badge.color, flexShrink: 0,
            }}>
              {candidate.score ?? '—'}
            </span>
          </div>
        );
      })}
    </DashboardCard>
  );
}

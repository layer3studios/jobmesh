// FILE: src/components/employer/jobs/parts/PostingStatusBadge.tsx
// Status pill for a posting, plus the applicant-count line that sits beside it in
// the jobs list. Both render nothing rather than something wrong when the data is
// missing — older postings predate the status field, and applicantCount is only
// computed by the LIST endpoint.

import type { PostingStatus } from '@/types/employer-jobs';

const BADGE_BASE = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  fontWeight: 500,
  display: 'inline-block',
  lineHeight: 1.5,
  textTransform: 'capitalize',
} as const;

const STATUS_STYLE: Record<PostingStatus, { background: string; color: string }> = {
  active: { background: 'var(--success-soft)', color: 'var(--success)' },
  draft: { background: 'var(--paper-2)', color: 'var(--ink-faint)' },
  closed: { background: 'var(--danger-soft)', color: 'var(--danger)' },
};

export function PostingStatusBadge({ status }: { status: PostingStatus | null | undefined }) {
  // Old rows can predate the status field. No badge beats a badge reading
  // "undefined" or a wrong colour asserting a state we do not actually know.
  const style = status ? STATUS_STYLE[status] : undefined;
  if (!style) return null;
  return <span style={{ ...BADGE_BASE, ...style }}>{status}</span>;
}

/**
 * "3 applicants" / "No applicants yet". Zero gets muted words rather than the
 * digit 0, which reads as a metric the employer failed at rather than an empty
 * state. A non-zero count is accented so it pulls the eye.
 */
export function ApplicantCount({ count }: { count: number | null | undefined }) {
  if (count == null) return null;
  const hasApplicants = count > 0;
  return (
    <span style={{
      fontSize: 12,
      color: hasApplicants ? 'var(--accent)' : 'var(--ink-muted)',
      fontWeight: hasApplicants ? 500 : 400,
    }}>
      {hasApplicants ? `${count} ${count === 1 ? 'applicant' : 'applicants'}` : 'No applicants yet'}
    </span>
  );
}

'use client';
// FILE: src/components/employer/jobs/parts/PostingActionBar.tsx
// The status + actions row at the top of the posting Overview tab. Extracted from
// PostingOverview so that file stays under the 200-line ceiling as actions grow.
// Purely presentational: every action is a callback the parent owns, so the
// mutation logic and this layout never drift into the same component.

import { Pencil, Clock, StopCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import type { Posting, PostingStatus } from '@/types/employer-jobs';
import { formatDeadline, deadlineUrgency } from '../deadline-helpers';

const STATUS_VARIANT: Record<PostingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success', draft: 'warning', closed: 'neutral',
};

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function PostingActionBar({
  posting, allowEdit, allowClose, isMutating,
  onEdit, onCopyApplyUrl, onCloseposting, onReopen, onFill,
}: {
  posting: Posting;
  allowEdit: boolean;
  allowClose: boolean;
  isMutating: boolean;
  onEdit: () => void;
  onCopyApplyUrl: () => void;
  onCloseposting: () => void;
  onReopen: () => void;
  onFill: () => void;
}) {
  const isOpenForApplicants = posting.status === 'draft' || posting.status === 'active';
  const deadlineLabel = formatDeadline(posting.applicationDeadline);
  const urgency = deadlineUrgency(posting.applicationDeadline);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Badge variant={STATUS_VARIANT[posting.status]}>{posting.status}</Badge>
      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
        Created {relativeTime(posting.createdAt)} · {posting.postedAt ? `Posted ${relativeTime(posting.postedAt)}` : 'Not yet published'}
      </span>
      {deadlineLabel && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
          // Elapsed but still active is the state that needs acting on: auto-close
          // has not run (or was never on) while the apply page already refuses.
          color: urgency === 'passed' ? 'var(--danger)'
            : urgency === 'soon' ? 'var(--warning)' : 'var(--ink-muted)',
        }}>
          <Clock size={12} aria-hidden />
          {urgency === 'passed' && posting.status === 'active'
            ? `Expired ${deadlineLabel} — will close automatically`
            : `Closes ${deadlineLabel}`}
        </span>
      )}
      <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
        {allowEdit && (
          <Button variant="ghost" size="sm" aria-label="Edit posting" onClick={onEdit}><Pencil size={14} /></Button>
        )}
        {/* Duplicate is a plain link: the New page reads ?duplicate and fetches the
            source itself, so there is nothing to mutate here. Available on any
            status — copying a closed posting to re-run the role is the common case. */}
        {allowEdit && (
          <Link href={`/employer/jobs/new?duplicate=${posting.id}`}>
            <Button variant="secondary" size="sm">Duplicate</Button>
          </Link>
        )}
        {posting.status === 'active' && (
          <Button variant="secondary" size="sm" onClick={onCopyApplyUrl}>Copy apply link</Button>
        )}
        {allowClose && isOpenForApplicants && (
          <Button variant="secondary" size="sm" loading={isMutating} onClick={onFill}>Position filled</Button>
        )}
        {/* "Close applications", not "Close posting": the neighbouring action
            ("Position filled") ALSO archives every remaining candidate, and the two
            were previously a word apart. This one only stops new submissions. */}
        {allowClose && isOpenForApplicants && (
          <Button
            variant="secondary"
            size="sm"
            loading={isMutating}
            iconLeft={<StopCircle size={14} aria-hidden />}
            onClick={onCloseposting}
          >
            Close applications
          </Button>
        )}
        {allowClose && posting.status === 'closed' && (
          <Button
            variant="secondary"
            size="sm"
            loading={isMutating}
            iconLeft={<PlayCircle size={14} aria-hidden />}
            onClick={onReopen}
          >
            Reopen
          </Button>
        )}
      </span>
    </div>
  );
}

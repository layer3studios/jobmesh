'use client';
// FILE: src/components/employer/jobs/JobsTable.tsx
// Postings table: Title | Applicants | Location | Work type | Status | Actions.
//
// The applicant count earned its own column. As a subtitle under the title it read
// as decoration; as a column it is the number an employer actually scans for, and
// it links straight to that posting's ranked list.
//
// Below 768px the same rows render as cards (jobs-table.css) — six columns cannot
// be read on a phone without horizontal scrolling. Both trees are always in the
// DOM and CSS picks one, so a resize never remounts the list.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Table } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { Posting } from '@/types/employer-jobs';
import { PostingStatusBadge } from '@/components/employer/jobs/parts/PostingStatusBadge';
import { WorkplaceBadge } from '@/components/employer/jobs/parts/WorkplaceBadge';
import PostingRowActions from '@/components/employer/jobs/parts/PostingRowActions';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';

export interface JobsTableProps {
  postings: Posting[];
  canEdit: boolean;
  canClose: boolean;
  canDelete: boolean;
  onFill: (posting: Posting) => void;
  onChanged: () => void;
}

const rankedHref = (postingId: string) =>
  withOrigin(`/employer/jobs/${postingId}?tab=ranked`, NAV_ORIGINS.JOBS);

/** The count, linked to that posting's ranked list. Zero stays muted and unlinked. */
function ApplicantCountCell({ posting }: { posting: Posting }) {
  const count = posting.applicantCount ?? 0;
  if (count === 0) {
    // Not a link: there is nothing on the other side, and a link that leads to an
    // empty list is a small betrayal repeated once per row.
    return <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>0</span>;
  }
  return (
    <Link
      href={rankedHref(posting.id)}
      onClick={(event) => event.stopPropagation()}
      style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}
    >
      {count}
    </Link>
  );
}

/** Apply-page views. Sits beside the applicant count as the top of the same funnel. */
function ViewCountCell({ posting }: { posting: Posting }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--ink-muted)' }}>
      <Eye size={13} aria-hidden="true" />
      {posting.viewCount ?? 0}
    </span>
  );
}

function buildColumns(props: Omit<JobsTableProps, 'postings'>): Column<Posting>[] {
  return [
    {
      key: 'title',
      header: 'Title',
      render: (posting) => (
        <Link
          href={withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS)}
          onClick={(event) => event.stopPropagation()}
          style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}
        >
          {posting.title}
        </Link>
      ),
    },
    { key: 'applicantCount', header: 'Applicants', render: (posting) => <ApplicantCountCell posting={posting} /> },
    { key: 'viewCount', header: 'Views', render: (posting) => <ViewCountCell posting={posting} /> },
    { key: 'location', header: 'Location', render: (posting) => posting.location },
    { key: 'workplaceType', header: 'Work type', render: (posting) => <WorkplaceBadge workplaceType={posting.workplaceType} /> },
    { key: 'status', header: 'Status', render: (posting) => <PostingStatusBadge status={posting.status} /> },
    {
      key: 'actions',
      header: '',
      render: (posting) => <PostingRowActions posting={posting} {...props} />,
    },
  ];
}

export default function JobsTable({ postings, ...actionProps }: JobsTableProps) {
  const router = useRouter();
  const openPosting = (posting: Posting) =>
    router.push(withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS));

  return (
    <>
      <div className="jobs-table-desktop">
        <Table columns={buildColumns(actionProps)} data={postings} onRowClick={openPosting} />
      </div>
      <div className="jobs-cards-mobile">
        {postings.map((posting) => (
          <div key={posting.id} className="jobs-card">
            <div style={{ minWidth: 0 }}>
              <Link href={withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS)} className="jobs-card-title">
                {posting.title}
              </Link>
              <div className="jobs-card-meta">
                <PostingStatusBadge status={posting.status} />
                <WorkplaceBadge workplaceType={posting.workplaceType} />
                <ApplicantCountCell posting={posting} />
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>applicants</span>
                <ViewCountCell posting={posting} />
              </div>
            </div>
            <PostingRowActions posting={posting} {...actionProps} />
          </div>
        ))}
      </div>
    </>
  );
}

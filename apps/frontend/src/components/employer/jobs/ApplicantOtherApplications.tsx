'use client';
// FILE: src/components/employer/jobs/ApplicantOtherApplications.tsx
// "Also applied to" — the same person's other applications at this company.
//
// Contacts are deduped by email per company, so these rows are the same human by
// construction, not a fuzzy name match. The card says "also applied to", never
// "possible duplicate": there is nothing here for the employer to reconcile.
//
// Sits directly under the contact card because it answers a question about WHO this
// is, not about how they scored. Renders nothing when the backend omitted the key,
// which it does for anyone who applied exactly once.

import Link from 'next/link';
import { Layers } from 'lucide-react';
import { Card, Stack, Badge } from '@/components/ui';
import type { OtherApplication } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';
import { formatRelativeTime } from './applicant-view-helpers';

const C = COPY.employer.applicants;

const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
// The accent hairline is the whole attention device: a tinted ground alone reads as
// decoration, and a full border would make a sidebar of bordered cards.
const BANNER_STYLE = {
  display: 'flex', alignItems: 'flex-start', gap: 8,
  padding: '8px 10px', borderRadius: 6,
  borderLeft: '2px solid var(--accent)', background: 'var(--accent-soft)',
  fontSize: '0.78rem', lineHeight: 1.45, color: 'var(--ink-2)',
};
const TITLE_LINK_STYLE = {
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent)',
  textDecoration: 'none', wordBreak: 'break-word' as const,
};
const META_STYLE = { fontSize: '0.72rem', color: 'var(--ink-faint)' };

/** "…3 other roles…" with the noun agreeing — one is a role, not roles. */
function bannerText(count: number): string {
  return C.alsoAppliedBanner
    .replace('{count}', String(count))
    .replace('{roleWord}', count === 1 ? C.roleSingular : C.rolePlural);
}

function OtherApplicationRow({ entry }: { entry: OtherApplication }) {
  const href = entry.postingId
    ? `/employer/jobs/${entry.postingId}/applicants/${entry.applicationId}`
    : null;
  const title = entry.postingTitle ?? COPY.employer.assignments.untitledPosting;

  return (
    <div style={{ opacity: entry.isArchived ? 0.6 : 1 }}>
      <Stack gap={3}>
        {href ? (
          <Link href={href} style={TITLE_LINK_STYLE}>{title}</Link>
        ) : (
          <span style={{ ...TITLE_LINK_STYLE, color: 'var(--ink)' }}>{title}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {entry.stage && <Badge variant="neutral" size="sm">{entry.stage}</Badge>}
          {/* Archived is stated, never implied by dimming alone — opacity is
              invisible to a screen reader and ambiguous to everyone else. */}
          {entry.isArchived && <Badge variant="neutral" size="sm">{C.archivedBadge}</Badge>}
          {entry.appliedAt && <span style={META_STYLE}>{formatRelativeTime(entry.appliedAt)}</span>}
        </div>
      </Stack>
    </div>
  );
}

export default function ApplicantOtherApplications({
  otherApplications,
}: {
  otherApplications: OtherApplication[];
}) {
  if (otherApplications.length === 0) return null;

  return (
    <Card>
      <Stack gap={10}>
        <div style={LABEL_STYLE}>{C.alsoAppliedTo}</div>
        <div style={BANNER_STYLE}>
          <Layers size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
          <span>{bannerText(otherApplications.length)}</span>
        </div>
        {/* Every row, no pagination: a company with more postings than fit here has
            a bigger problem than this list. */}
        <Stack gap={10}>
          {otherApplications.map((entry) => (
            <OtherApplicationRow key={entry.applicationId} entry={entry} />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

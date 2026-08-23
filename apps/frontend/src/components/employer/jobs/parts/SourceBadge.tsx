// FILE: src/components/employer/jobs/parts/SourceBadge.tsx
// "Referral" beside a candidate's name on the ranked table.
//
// Rendered ONLY for referrals. Every other source — the apply page, an import, a
// utm answer — is the unremarkable case, and badging it would add a pill to almost
// every row while saying nothing a recruiter would act on. A referral is the one
// source that changes how the row is read, so it is the one that gets a badge.

import { COPY } from '@/theme/brand';

const TEXT = COPY.employer.referrals;

export default function SourceBadge({ source, sourceDetail }: {
  source?: string | null;
  sourceDetail?: string | null;
}) {
  if (source !== 'referral') return null;
  // The tooltip names the referrer; the badge stays one short word so it never
  // competes with the candidate's name for width.
  const tooltip = sourceDetail
    ? TEXT.rowBadgeTooltip.replace('{name}', sourceDetail)
    : TEXT.rowBadge;

  return (
    <span
      title={tooltip}
      style={{
        flexShrink: 0, padding: '1px 6px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        background: 'var(--accent-soft)', color: 'var(--accent)',
      }}
    >
      {TEXT.rowBadge}
      <span className="sr-only"> — {tooltip}</span>
    </span>
  );
}

'use client';
// FILE: src/components/employer/jobs/parts/ReferralSection.tsx
// Composes the referral surfaces on the posting overview and owns the one role
// decision between them, so PostingOverview stays a layout file.
//
// Everyone Member+ gets the share panel — referrals only work if the whole team
// can take part. The activity table is Owner+ because reading who shared what is
// oversight, not participation, and the backend enforces the same split.

import { Stack } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canViewReferralActivity, canShareReferralLink } from '@/lib/team-permissions';
import ReferralSharePanel from './ReferralSharePanel';
import ReferralActivityList from './ReferralActivityList';

export default function ReferralSection({ postingId }: { postingId: string }) {
  const { viewerRole } = useEmployer();
  // Absent role means the roster has not resolved yet. Showing the share panel
  // optimistically matches how the rest of this page treats an unknown role; the
  // activity table stays hidden until we actually know, because it is the gated one.
  const mayShare = viewerRole ? canShareReferralLink(viewerRole) : true;
  const mayViewActivity = viewerRole ? canViewReferralActivity(viewerRole) : false;

  if (!mayShare && !mayViewActivity) return null;

  return (
    <Stack gap={14}>
      {mayShare && <ReferralSharePanel postingId={postingId} />}
      {mayViewActivity && <ReferralActivityList postingId={postingId} />}
    </Stack>
  );
}

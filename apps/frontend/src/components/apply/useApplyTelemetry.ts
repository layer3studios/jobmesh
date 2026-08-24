'use client';
// FILE: src/components/apply/useApplyTelemetry.ts
// The two page-level apply events. Split from ApplyFormClient for size (section 2).

import { useEffect } from 'react';
import type { PublicAssignment } from '@/types/public-apply';
import { trackEvent } from '@/lib/analytics-events';

export function useApplyTelemetry({ jobId, companySlug, assignment }: {
  jobId: string;
  companySlug: string;
  assignment: PublicAssignment | null;
}) {
  const hasAssignment = assignment != null;

  // Reaching the apply form = the seeker started applying (public, unauthenticated
  // flow). hasAssignment is the denominator half of the abandonment ratio: this
  // event fires for BOTH populations, so the flag is what lets the two be compared.
  useEffect(() => {
    trackEvent('apply_started', {
      jobId, companyId: companySlug, applyMethod: 'public', hasAssignment,
    });
  }, [jobId, companySlug, hasAssignment]);

  useEffect(() => {
    if (!assignment) return; // plain posting — no assignment telemetry at all
    trackEvent('assignment_apply_form_viewed', { postingId: jobId, assignmentId: assignment.id });
  }, [assignment, jobId]);
}

export default useApplyTelemetry;

'use client';
// FILE: src/components/employer/jobs/useApplicantReviewAnalytics.ts
// Funnel 5 trackers for the applicant review rail, extracted from ApplicantReviewPanel
// to keep that file within the 200-line cap. postingId comes from the route, companyId
// from the employer session; the panel only supplies the applicationId.
import { useParams } from 'next/navigation';
import { useEmployer } from '@/context/employer/EmployerContext';
import { trackEvent } from '@/lib/analytics-events';

export function useApplicantReviewAnalytics(applicationId: string) {
  const params = useParams<{ postingId: string }>();
  const postingId = typeof params.postingId === 'string' ? params.postingId : '';
  const companyId = useEmployer().company?.id ?? undefined;
  return {
    trackMove: (fromStage: string, toStage: string) =>
      trackEvent('applicant_moved_stage', { applicationId, postingId, companyId, fromStage, toStage, method: 'select' }),
    trackArchive: (archiveReason: string) =>
      trackEvent('applicant_archived', { applicationId, postingId, companyId, archiveReason, isBulk: false }),
    trackRescore: () => trackEvent('applicant_rescored', { applicationId, postingId, companyId }),
  };
}

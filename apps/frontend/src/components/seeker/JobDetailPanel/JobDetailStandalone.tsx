'use client';
// FILE: src/components/seeker/JobDetailPanel/JobDetailStandalone.tsx
// Client wrapper that mounts the shared JobDetailPanel on the standalone
// /jobs/[jobId] SEO route. Wires applied state + comeback from seeker context/hook
// (D_impl_10); selecting a "similar role" navigates to its own detail route.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { IJob } from '../../../types';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { useComeBack } from '../../../hooks/seeker/useComeBack';
import { trackEvent } from '../../../lib/analytics-events';
import { getFromRoute } from '../../../lib/from-route';
import JobDetailPanel from './index';

export default function JobDetailStandalone({ job }: { job: IJob }) {
  const router = useRouter();
  const { currentUser, appliedJobIds, toggleApplied } = useSeeker();
  const { comeBackMap, toggle, remove } = useComeBack(currentUser);

  // Seeker opened a job's standalone detail page. IJob (scraped listing) exposes no
  // companyId/jobSlug — company name is public listing data, safe to send.
  useEffect(() => {
    trackEvent('job_viewed', { jobId: job._id, company: job.Company, fromRoute: getFromRoute() });
  }, [job._id, job.Company]);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14,
      overflow: 'hidden', background: 'var(--surface)', minHeight: 480,
    }}>
      <JobDetailPanel
        job={job}
        appliedJobIds={appliedJobIds}
        comeBackMap={comeBackMap}
        onToggleApplied={toggleApplied}
        onToggleComeBack={toggle}
        onRemoveComeBack={remove}
        onSelectJob={(j) => router.push(`/jobs/${j._id}`)}
      />
    </div>
  );
}

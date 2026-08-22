'use client';
// FILE: src/app/(employer)/employer/(app)/(onboarded)/jobs/page.tsx
// Employer postings list. Auth + onboarding enforced by the layouts; renders the
// ported JobsList.
import JobsList from '@/components/employer/jobs/JobsList';

export default function Page() {
  return <JobsList />;
}

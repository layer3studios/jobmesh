'use client';
// FILE: src/components/employer/jobs/DetailSettings.tsx
// Settings tab body — configuration only. The JD/overview content (status,
// apply URL, description, edit, close) moved to PostingOverview.tsx. Close is
// a status change and lives on Overview; no Delete posting exists, so this tab
// has no danger zone — just interview scheduling.

import { useEmployer } from '@/context/employer/EmployerContext';
import { canEditPosting } from '@/lib/team-permissions';
import InterviewSchedulingSettings from '@/components/employer/jobs/InterviewSchedulingSettings';
import type { Posting } from '@/types/employer-jobs';

export default function DetailSettings({ posting }: { posting: Posting }) {
  const { viewerRole } = useEmployer();
  // UX gate — Interviewers cannot configure scheduling. Backend still enforces.
  const allowEdit = viewerRole ? canEditPosting(viewerRole) : true;

  if (!allowEdit) {
    return (
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
        Posting settings are managed by members and above.
      </p>
    );
  }
  return <InterviewSchedulingSettings posting={posting} />;
}

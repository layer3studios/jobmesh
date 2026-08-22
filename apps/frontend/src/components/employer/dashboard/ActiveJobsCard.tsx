'use client';
// FILE: src/components/employer/dashboard/ActiveJobsCard.tsx
// "Active jobs" card: one row per active posting with a mini stacked pipeline
// bar (segments proportional to stageCounts, stage colours from the pipeline
// redesign). Whole row navigates to the posting overview.

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { stageColor } from '@/components/employer/jobs/PipelineColumn';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';
import type { DashboardActiveJob, DashboardStageCounts } from '@/types/employer-dashboard';
import { DashboardCard } from './DashboardCard';

const STAGE_ORDER: Array<keyof DashboardStageCounts> = ['applied', 'shortlisted', 'interview', 'offer', 'hired'];
const HEAD_CELL = { fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', textAlign: 'left' } as const;
const GRID = { display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 70px', alignItems: 'center', gap: 8 } as const;

function MiniPipelineBar({ stageCounts }: { stageCounts: DashboardStageCounts }) {
  const total = STAGE_ORDER.reduce((sum, key) => sum + (stageCounts[key] ?? 0), 0);
  return (
    <span data-testid="mini-pipeline-bar" style={{
      display: 'flex', width: 80, height: 4, borderRadius: 999, overflow: 'hidden',
      background: 'var(--surface-raised)',
    }}>
      {total > 0 && STAGE_ORDER.filter((key) => (stageCounts[key] ?? 0) > 0).map((key) => (
        <span key={key} style={{ width: `${((stageCounts[key] ?? 0) / total) * 100}%`, background: stageColor(key) }} />
      ))}
    </span>
  );
}

export default function ActiveJobsCard({ jobs }: { jobs: DashboardActiveJob[] }) {
  const router = useRouter();
  // ?from=dashboard keeps the nav + breadcrumb rooted where the user started.
  const open = (id: string) => router.push(withOrigin(`/employer/jobs/${id}?tab=overview`, NAV_ORIGINS.DASHBOARD));

  return (
    <DashboardCard title="Active jobs" action={{ label: 'View all', href: '/employer/jobs' }}>
      {jobs.length === 0 ? (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
          No active jobs. Create your first posting to start hiring.
        </p>
      ) : (
        <div>
          <div style={{ ...GRID, padding: '8px 16px', background: 'var(--surface-raised)', borderBottom: '0.5px solid var(--border)' }}>
            <span style={HEAD_CELL}>Job</span>
            <span style={HEAD_CELL}>Applicants</span>
            <span style={HEAD_CELL}>Pipeline</span>
            <span style={HEAD_CELL}>Days open</span>
            <span />
          </div>
          {jobs.map((job) => (
            <div
              key={job.id}
              data-testid={`active-job-row-${job.id}`}
              onClick={() => open(job.id)}
              style={{ ...GRID, padding: '10px 16px', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-faint)' }}>{job.location ?? '—'}</span>
              </span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{job.applicantCount}</span>
              <MiniPipelineBar stageCounts={job.stageCounts} />
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{job.daysOpen}d</span>
              <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); open(job.id); }}>
                View
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

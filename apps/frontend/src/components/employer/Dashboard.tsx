'use client';
// FILE: src/components/employer/Dashboard.tsx
// Employer dashboard: greeting + KPI row, active jobs + top candidates on the
// left, upcoming-interviews count + activity timeline on the right. All data
// arrives from useDashboard (summary + activity fetched in parallel). No
// page-level scroll unless content genuinely overflows — the activity feed
// scrolls internally.

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { useIsNarrowViewport } from '@/components/employer/jobs/useIsNarrowViewport';
import { useEmployer } from '@/context/employer/EmployerContext';
import { useDashboard } from '@/hooks/employer/useDashboard';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';
import { KpiTile, kpiValue } from './dashboard/DashboardCard';
import ActiveJobsCard from './dashboard/ActiveJobsCard';
import TopCandidatesCard from './dashboard/TopCandidatesCard';
import { UpcomingInterviewsCard, ActivityCard } from './dashboard/ActivityCard';
import CompanyActivityCard from './dashboard/CompanyActivityCard';

const PAGE_STYLE = { padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 } as const;
// Desktop pins the page to the viewport minus the top nav and clips it, so the
// DOCUMENT never scrolls — the columns own their height and scroll internally.
// Mobile keeps natural flow (stacked columns are meant to scroll the page).
const NAV_HEIGHT_PIXELS = 65;
const LOCKED_PAGE_STYLE: CSSProperties = {
  ...PAGE_STYLE,
  height: `calc(100dvh - ${NAV_HEIGHT_PIXELS}px)`,
  overflow: 'hidden',
  boxSizing: 'border-box',
};
const SKELETON_STYLE = { borderRadius: 10, animation: 'jm-dash-pulse 1.2s ease-in-out infinite' } as const;

function Skeleton({ height }: { height: number }) {
  return <div data-testid="dashboard-skeleton" style={{ ...SKELETON_STYLE, height }} />;
}

function LoadingState() {
  return (
    <div style={PAGE_STYLE}>
      <style>{`@keyframes jm-dash-pulse { 0%, 100% { background: var(--surface); } 50% { background: var(--surface-raised); } }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={64} />)}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={180} /><Skeleton height={180} />
        </div>
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={120} /><Skeleton height={220} />
        </div>
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const router = useRouter();
  const narrow = useIsNarrowViewport();
  const { employerUser } = useEmployer();
  const { summary, activity, loading, error, refetch } = useDashboard();

  if (loading) return <LoadingState />;

  if (error || !summary) {
    return (
      <div style={{ ...PAGE_STYLE, alignItems: 'center', paddingTop: 80 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
          Couldn&apos;t load the dashboard. Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  }

  const firstName = (employerUser?.name ?? '').trim().split(/\s+/)[0] || 'there';
  const { kpis } = summary;

  return (
    <div style={narrow ? PAGE_STYLE : LOCKED_PAGE_STYLE}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
            Here&apos;s what&apos;s happening with your hiring.
          </p>
        </div>
        <Button iconLeft={<Plus size={15} />} onClick={() => router.push(withOrigin('/employer/jobs/new', NAV_ORIGINS.DASHBOARD))}>
          New posting
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, flexShrink: 0 }}>
        <KpiTile label="Active jobs" value={kpiValue(kpis.activeJobs)} onClick={() => router.push('/employer/jobs')} />
        <KpiTile label="Total applicants" value={kpiValue(kpis.totalApplicants)} />
        <KpiTile label="Interviews this week" value={kpiValue(kpis.interviewsThisWeek)} />
        <KpiTile label="Avg. AI score" value={kpiValue(kpis.avgAiScore)} />
        <KpiTile label="Avg. time to hire" value={kpiValue(kpis.avgDaysToHire, 'd')} />
      </div>

      {/* NO wrapping on desktop: a wrapping flex container sizes its line from
          CONTENT, so the columns would never inherit this row's height and the
          activity list could not scroll internally. Narrow stacks instead. */}
      <div style={{
        display: 'flex', gap: 16,
        flexWrap: narrow ? 'wrap' : 'nowrap',
        alignItems: narrow ? 'flex-start' : 'stretch',
        ...(narrow ? {} : { flex: 1, minHeight: 0 }),
      }}>
        {/* Each column scrolls on its own so a long list never scrolls the page. */}
        <div className={narrow ? undefined : 'panel-scroll'} style={{
          flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16,
          ...(narrow ? {} : { minHeight: 0, overflowY: 'auto' }),
        }}>
          <ActiveJobsCard jobs={summary.activeJobs} />
          <TopCandidatesCard candidates={summary.topCandidates} jobs={summary.activeJobs} />
          {/* Company-wide and actor-led — the team's work across every posting.
              The right rail's feed answers a different question (what happened to
              candidates), so the two sit in different columns rather than merging. */}
          <CompanyActivityCard />
        </div>
        <div style={{
          width: narrow ? '100%' : 380, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 16,
          ...(narrow ? {} : { minHeight: 0 }),
        }}>
          <UpcomingInterviewsCard count={kpis.interviewsThisWeek} />
          <ActivityCard events={activity} fill={!narrow} />
        </div>
      </div>
    </div>
  );
}

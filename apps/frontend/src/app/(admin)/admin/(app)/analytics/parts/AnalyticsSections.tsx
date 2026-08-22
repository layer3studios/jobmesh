// FILE: src/app/(admin)/admin/(app)/analytics/parts/AnalyticsSections.tsx
// Dense, overview-first section layout for the admin analytics dashboard. Extracted
// from AdminAnalyticsClient (C1 line cap). The six at-a-glance numbers come first,
// then half-width section pairs. Density comes from layout — the tiles and charts
// themselves are the existing parts, unchanged.
import type { ReactNode } from 'react';
import type { AdminAnalyticsData } from '@/types/admin-analytics';
import KpiTile from './KpiTile';
import SparklineCard from './SparklineCard';
import FunnelBarChart from './FunnelBarChart';
import PieDistribution from './PieDistribution';
import SectionHeader from './SectionHeader';

// auto-fit grid: as many columns as `min` allows — the overview runs 6-across on
// desktop and wraps down to 2 on phones without media queries. min(…, 100%) keeps
// a wide `min` from forcing horizontal overflow on small viewports.
function Grid({ children, min = 170 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}>
      {children}
    </div>
  );
}

// Two half-width section groups side by side on desktop, stacked when narrow.
function Pair({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', alignItems: 'start' }}>
      {children}
    </div>
  );
}

function acceptRate(sent: number, accepted: number): string {
  return sent <= 0 ? '—' : `${Math.round((accepted / sent) * 100)}% accepted`;
}

export default function AnalyticsSections({ data }: { data: AdminAnalyticsData }) {
  const { volume, seeker, employer, engagement, team, traffic } = data;
  return (
    <>
      {/* Overview — the six numbers an admin checks first (Volume + top of funnel). */}
      <SectionHeader title="Overview" cachedAt={volume.cachedAt} />
      <Grid>
        <KpiTile label="Visitors" value={volume.visitorsTotal} />
        <KpiTile label="Pageviews" value={volume.pageviewsTotal} />
        <KpiTile label="Signups" value={seeker.signups} />
        <KpiTile label="Logins" value={seeker.logins} />
        <KpiTile label="Job detail views" value={seeker.jobDetailViews} />
        <KpiTile label="Applies started" value={seeker.applyStarted} />
      </Grid>
      <div style={{ marginTop: 12 }}>
        <Grid min={380}>
          <SparklineCard title="Visitors / day" data={volume.visitorsByDay} />
          <SparklineCard title="Pageviews / day" data={volume.pageviewsByDay} />
        </Grid>
      </div>

      {/* Conversion funnels — seeker and employer side by side. */}
      <Pair>
        <div>
          <SectionHeader title="Seeker funnel" cachedAt={seeker.cachedAt} />
          <Grid min={220}>
            <KpiTile label="Jobs list views" value={seeker.jobsListViews} />
            <KpiTile label="Apply submitted" value={seeker.applySubmitted} />
            <KpiTile label="Apply success" value={seeker.applySuccessViewed} />
          </Grid>
          <div style={{ marginTop: 12 }}>
            <FunnelBarChart title="Seeker conversion" stages={seeker.funnel} />
          </div>
        </div>
        <div>
          <SectionHeader title="Employer funnel" cachedAt={employer.cachedAt} />
          <Grid min={220}>
            <KpiTile label="Signups" value={employer.signups} />
            <KpiTile label="Logins" value={employer.logins} />
            <KpiTile label="Onboarding started" value={employer.onboardingStarted} />
            <KpiTile label="Onboarding done" value={employer.onboardingCompleted} />
            <KpiTile label="Postings created" value={employer.postingsCreated} />
            <KpiTile label="Postings published" value={employer.postingsPublished} />
          </Grid>
          <div style={{ marginTop: 12 }}>
            <FunnelBarChart title="Employer conversion" stages={employer.funnel} />
          </div>
        </div>
      </Pair>

      {/* Engagement + Team side by side — small-number sections share a row. */}
      <Pair>
        <div>
          <SectionHeader title="Employer engagement" cachedAt={engagement.cachedAt} />
          <Grid min={160}>
            <KpiTile label="Applicants viewed" value={engagement.applicantsViewed} />
            <KpiTile label="Stage moves" value={engagement.applicantsMovedStage} />
            <KpiTile label="Applicants archived" value={engagement.applicantsArchived} />
            <KpiTile label="Notes added" value={engagement.notesAdded} />
          </Grid>
        </div>
        <div>
          <SectionHeader title="Team invites" cachedAt={team.cachedAt} />
          <Grid min={160}>
            <KpiTile label="Invites sent" value={team.invitesSent} />
            <KpiTile label="Invites accepted" value={team.invitesAccepted} hint={acceptRate(team.invitesSent, team.invitesAccepted)} />
          </Grid>
        </div>
      </Pair>

      <SectionHeader title="Traffic sources" cachedAt={traffic.cachedAt} />
      <Grid min={380}>
        <PieDistribution title="By referrer" data={traffic.byReferrer.map((r) => ({ name: r.bucket, value: r.count }))} />
        <PieDistribution title="By device" data={traffic.byDevice.map((d) => ({ name: d.type, value: d.count }))} />
      </Grid>
    </>
  );
}

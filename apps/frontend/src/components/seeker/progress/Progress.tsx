'use client';
// FILE: src/components/seeker/progress/Progress.tsx
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, Briefcase, Target } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Container, PageHeader, Button, EmptyState } from '../../ui';
import { COPY } from '../../../theme/brand';
import ProgressRing from '../ProgressRing';
import ActivityChart from '../ActivityChart';
import HeatmapCalendar from '../HeatmapCalendar';
import FunnelChart from '../FunnelChart';
import PipelineView, { type PipelineJob } from '../PipelineView';
import type { AppliedJobDetail } from '../../../types';

export default function Progress() {
  const router = useRouter();
  const { currentUser, appliedJobs, todayCount, streak, dailyGoal, saveDailyGoal, updateStage } = useSeeker();
  const [appliedDetails, setAppliedDetails] = useState<AppliedJobDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = COPY.site.documentTitleProgress; }, []);

  useEffect(() => {
    if (!currentUser) { router.push('/jobs'); return; }
    let cancelled = false;
    fetch('/api/seeker/me/applied/details', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((d: AppliedJobDetail[]) => { if (!cancelled) setAppliedDetails(Array.isArray(d) ? d : []); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, router]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const j of appliedDetails) {
      const s = j.stage || 'applied';
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [appliedDetails]);

  const pipelineJobs: PipelineJob[] = useMemo(() => appliedDetails.map(d => ({
    jobId: d.jobId,
    jobTitle: d.jobTitle,
    company: d.company,
    location: d.location,
    department: d.department,
    applicationURL: d.applicationURL,
    stage: d.stage || 'applied',
    stageUpdatedAt: d.stageUpdatedAt || d.appliedAt,
    appliedAt: d.appliedAt,
    isListingActive: d.isListingActive,
  })), [appliedDetails]);

  if (!currentUser) return null;

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <Link
        href="/jobs"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: '0.82rem', color: 'var(--ink-muted)',
          textDecoration: 'none', marginBottom: 14, fontWeight: 500,
        }}
      >
        <ArrowLeft size={13} /> {COPY.progress.backToJobs}
      </Link>

      <PageHeader
        label={COPY.progress.pageLabel}
        title={COPY.progress.pageTitle}
      />

      {appliedJobs.length === 0 && !loading ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={COPY.progress.emptyTitle}
          body={COPY.progress.emptyBody}
          action={<Button as="a" href="/jobs" variant="primary" size="md">Browse jobs</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Dense 2-col grid on desktop, single column on mobile.
              Left: today's progress + last 7 days. Right: heatmap + funnel. */}
          <div className="progress-grid">
            <div className="progress-col">
              {/* Today's progress: ring + quick stats */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 'clamp(14px, 2.5vw, 18px)',
              }}>
                <ProgressRing
                  todayCount={todayCount}
                  dailyGoal={dailyGoal}
                  onGoalChange={saveDailyGoal}
                />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 10,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}>
                  <Stat icon={<Flame size={14} />} value={streak} label="Day streak" />
                  <Stat icon={<Briefcase size={14} />} value={appliedJobs.length} label="Total applied" />
                  <Stat icon={<Target size={14} />} value={`${dailyGoal}/day`} label="Goal" />
                </div>
              </div>

              <Section title="Last 7 days">
                <ActivityChart appliedJobs={appliedJobs} dailyGoal={dailyGoal} />
              </Section>
            </div>

            <div className="progress-col">
              <Section title="Activity heatmap">
                <HeatmapCalendar appliedJobs={appliedJobs} dailyGoal={dailyGoal} />
              </Section>
              <Section title="Application funnel">
                <FunnelChart stageCounts={stageCounts} totalApplied={appliedDetails.length} />
              </Section>
            </div>
          </div>

          {/* Pipeline / application history — full width below the grid */}
          <Section title={COPY.progress.historyLabel} subtitle={COPY.progress.historySubtitle}>
            {loading ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11 }} />)}
              </div>
            ) : (
              <PipelineView jobs={pipelineJobs} onStageChange={updateStage} />
            )}
          </Section>
        </div>
      )}
    </Container>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 'clamp(14px, 2.5vw, 18px)',
    }}>
      <h2 className="font-display" style={{
        fontSize: '1rem',
        fontWeight: 600, color: 'var(--ink)',
        letterSpacing: '-0.02em', marginBottom: subtitle ? 4 : 12,
      }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 14 }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--paper-2)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6,
          background: 'var(--surface)', color: 'var(--ink-muted)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)',
        }}>{icon}</span>
        <span style={{
          fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 3 }}>{label}</p>
    </div>
  );
}

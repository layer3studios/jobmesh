'use client';
// FILE: src/components/seeker/today/SearchSection.tsx
// The second half of Today — what used to be /progress. Last 7 days, the
// activity heatmap, the funnel, and the pipeline of every application with
// its stage. `#pipeline` is the anchor old /progress links land on.
import { useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Button, EmptyState } from '../../ui';
import ActivityChart from '../ActivityChart';
import HeatmapCalendar from '../HeatmapCalendar';
import FunnelChart from '../FunnelChart';
import PipelineView, { type PipelineJob } from '../PipelineView';
import type { AppliedJobDetail } from '../../../types';
import { Section } from './shared';

export default function SearchSection() {
  const { currentUser, appliedJobs, dailyGoal, updateStage } = useSeeker();
  const [details, setDetails] = useState<AppliedJobDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    fetch('/api/seeker/me/applied/details', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((d: AppliedJobDetail[]) => { if (!cancelled) setDetails(Array.isArray(d) ? d : []); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, appliedJobs.length]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of details) { const s = d.stage || 'applied'; c[s] = (c[s] || 0) + 1; }
    return c;
  }, [details]);

  const pipelineJobs: PipelineJob[] = useMemo(() => details.map(d => ({
    jobId: d.jobId, jobTitle: d.jobTitle, company: d.company, applicationURL: d.applicationURL,
    location: d.location, department: d.department, stage: d.stage, stageUpdatedAt: d.stageUpdatedAt,
    appliedAt: d.appliedAt, isListingActive: d.isListingActive,
  })), [details]);

  // Scroll to the pipeline when arriving from a retired /progress link.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#pipeline' || loading) return;
    document.getElementById('pipeline')?.scrollIntoView({ block: 'start' });
  }, [loading]);

  if (appliedJobs.length === 0 && !loading) {
    return (
      <div id="pipeline" className="td-anchor">
        <EmptyState
          icon={<Briefcase size={28} />}
          title="Your pipeline starts with one application"
          body="Apply from the board and every role you've applied to shows up here with its stage — applied, interview, offer."
          action={<Button as="a" href="/jobs" variant="primary" size="md">Browse roles</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="td-grid">
        <div className="td-col">
          <Section label="Last 7 days"><ActivityChart appliedJobs={appliedJobs} dailyGoal={dailyGoal} /></Section>
          <Section label="Funnel" sub={details.length ? `${details.length} tracked` : undefined}>
            <FunnelChart stageCounts={stageCounts} totalApplied={details.length} />
          </Section>
        </div>
        <div className="td-col">
          <Section label="Activity"><HeatmapCalendar appliedJobs={appliedJobs} dailyGoal={dailyGoal} /></Section>
        </div>
      </div>

      <Section id="pipeline" label="Pipeline" sub="Every role you've applied to, grouped by company. Move a stage when you hear back.">
        {loading ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11 }} />)}
          </div>
        ) : (
          <PipelineView jobs={pipelineJobs} onStageChange={updateStage} />
        )}
      </Section>
    </div>
  );
}

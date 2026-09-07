'use client';
// FILE: src/components/seeker/pipeline/Pipeline.tsx
// /pipeline: every role the seeker has applied to, grouped by company, with
// its stage. Lives in the SeekerWorkspace frame so it reads as one of the
// account pages; the sidebar shows the same three numbers as Profile.
import { useEffect, useMemo, useState } from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Button, EmptyState } from '../../ui';
import SeekerWorkspace from '../SeekerWorkspace';
import PipelineView, { type PipelineJob } from '../PipelineView';
import FunnelChart from '../FunnelChart';
import type { AppliedJobDetail } from '../../../types';
import { BRAND } from '../../../theme/brand';
import { Section } from '../today/shared';

export default function Pipeline() {
  const { currentUser, appliedJobs, updateStage } = useSeeker();
  const [details, setDetails] = useState<AppliedJobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { document.title = `Pipeline · ${BRAND.appName}`; }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (appliedJobs.length === 0) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    fetch('/api/seeker/me/applied/details', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`Your pipeline did not load (${r.status}).`); return r.json(); })
      .then((d: AppliedJobDetail[]) => { if (!cancelled) setDetails(Array.isArray(d) ? d : []); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Your pipeline did not load.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, appliedJobs.length, attempt]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of details) { const s = d.stage || 'applied'; c[s] = (c[s] || 0) + 1; }
    return c;
  }, [details]);

  const jobs: PipelineJob[] = useMemo(() => details.map(d => ({
    jobId: d.jobId, jobTitle: d.jobTitle, company: d.company, applicationURL: d.applicationURL,
    location: d.location, department: d.department, stage: d.stage, stageUpdatedAt: d.stageUpdatedAt,
    appliedAt: d.appliedAt, isListingActive: d.isListingActive,
  })), [details]);

  const sub = details.length
    ? `${details.length} ${details.length === 1 ? 'application' : 'applications'} across ${new Set(details.map(d => d.company)).size} ${new Set(details.map(d => d.company)).size === 1 ? 'company' : 'companies'}`
    : 'Every role you have applied to, with its stage.';

  return (
    <SeekerWorkspace label="Seeker" title="Your pipeline">
      {appliedJobs.length === 0 && !loading ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="Your pipeline starts with one application"
          body="Apply from the board and every role shows up here with its stage: applied, interview, offer."
          action={<Button as="a" href="/jobs" variant="primary" size="md">Browse roles</Button>}
        />
      ) : (
        <div className="td-stack">
          <Section label="Funnel" sub={details.length ? `${details.length} tracked` : undefined}>
            {loading ? (
              <div className="skeleton" style={{ height: 120, borderRadius: 11 }} aria-busy="true" />
            ) : error ? null : (
              <FunnelChart stageCounts={stageCounts} totalApplied={details.length} />
            )}
          </Section>
          <Section label="Pipeline" sub={sub}>
            {loading ? (
              <div style={{ display: 'grid', gap: 8 }} aria-busy="true">
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11, opacity: 1 - i * 0.15 }} />)}
              </div>
            ) : error ? (
              <div className="jb-error rise td-error" role="alert">
                <p className="jb-error__title">The pipeline is taking a moment</p>
                <p className="jb-error__body">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => setAttempt(a => a + 1)} iconLeft={<RefreshCw size={13} />}>Try again</Button>
              </div>
            ) : (
              <PipelineView jobs={jobs} onStageChange={updateStage} />
            )}
          </Section>
        </div>
      )}
    </SeekerWorkspace>
  );
}

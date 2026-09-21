'use client';
// FILE: src/components/seeker/pipeline/Pipeline.tsx
// /pipeline: every role the seeker has applied to, grouped by company, with
// its stage. Full width, editorial: a masthead with the numbers that matter
// (applications, companies, interviews, offers), the stages as a step strip
// with a count under each, then the pipeline list.
import { useEffect, useMemo, useState } from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Button, EmptyState } from '../../ui';
import SeekerWorkspace from '../SeekerWorkspace';
import PipelineView, { type PipelineJob } from '../PipelineView';
import { STAGES, STAGE_ORDER, type StageName } from '../pipeline-stages';
import type { AppliedJobDetail } from '../../../types';
import { BRAND } from '../../../theme/brand';
import { EdSection } from '../today/shared';

/** The funnel as a strip of stages: a running number, the stage, and its count in the serif. */
function StageStrip({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
    <ol className="stg" aria-label="Applications by stage">
      {STAGE_ORDER.map((s: StageName, i) => {
        const n = counts[s] || 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <li key={s} className="stg__item" data-empty={n === 0 ? 'true' : 'false'} style={{ '--i': i } as React.CSSProperties}>
            <span className="stg__num">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-display stg__count">{n}</span>
            <span className="stg__label">{STAGES[s].label}</span>
            <span className="stg__bar" aria-hidden><span style={{ transform: `scaleX(${pct / 100})` }} /></span>
            <span className="stg__pct">{n > 0 ? `${pct}%` : '—'}</span>
          </li>
        );
      })}
    </ol>
  );
}

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

  const companies = useMemo(() => new Set(details.map(d => d.company)).size, [details]);
  const interviews = (stageCounts.screening || 0) + (stageCounts.interview || 0);
  const offers = (stageCounts.offer || 0) + (stageCounts.accepted || 0);
  const empty = appliedJobs.length === 0 && !loading;

  const lede = empty
    ? 'Every role you apply to lands here with its stage.'
    : offers > 0
      ? 'An offer on the table. Keep the others warm.'
      : interviews > 0
        ? `${interviews} ${interviews === 1 ? 'conversation' : 'conversations'} in motion. Move a stage when you hear back.`
        : 'Applied and waiting. Move a stage the moment you hear back.';

  return (
    <SeekerWorkspace
      label="Your pipeline"
      title={empty ? 'Nothing in flight yet' : 'What is in flight'}
      lede={lede}
      tally={empty ? undefined : [
        { value: details.length || appliedJobs.length, label: details.length === 1 ? 'application' : 'applications' },
        { value: companies, label: companies === 1 ? 'company' : 'companies' },
        { value: interviews, label: interviews === 1 ? 'interview' : 'interviews' },
        { value: offers, label: offers === 1 ? 'offer' : 'offers' },
      ]}
    >
      {empty ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="Your pipeline starts with one application"
          body="Apply from the board and every role shows up here with its stage: applied, interview, offer."
          action={<Button as="a" href="/jobs" variant="primary" size="md">Browse roles</Button>}
        />
      ) : (
        <div className="ws-sections">
          <EdSection id="stages" number="01" kicker="By stage" title="Where things stand">
            {loading ? (
              <div className="stg stg--skel" aria-busy="true">
                {STAGE_ORDER.map((s, i) => <div key={s} className="skeleton" style={{ height: 96, borderRadius: 8, opacity: 1 - i * 0.1 }} />)}
              </div>
            ) : error ? null : (
              <StageStrip counts={stageCounts} total={details.length} />
            )}
          </EdSection>

          <EdSection id="pipeline" number="02" kicker="By company" title="Every application" link={{ label: 'Browse roles', to: '/jobs' }}>
            {loading ? (
              <div style={{ display: 'grid', gap: 8, paddingTop: 14 }} aria-busy="true">
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11, opacity: 1 - i * 0.15 }} />)}
              </div>
            ) : error ? (
              <div className="jb-error rise td-error" role="alert">
                <p className="jb-error__title">The pipeline is taking a moment</p>
                <p className="jb-error__body">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => setAttempt(a => a + 1)} iconLeft={<RefreshCw size={13} />}>Try again</Button>
              </div>
            ) : (
              <div style={{ paddingTop: 14 }}><PipelineView jobs={jobs} onStageChange={updateStage} /></div>
            )}
          </EdSection>
        </div>
      )}
    </SeekerWorkspace>
  );
}

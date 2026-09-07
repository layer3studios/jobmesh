'use client';
// FILE: src/components/seeker/today/SearchSection.tsx
// The second half of Today: the last 7 days, the activity heatmap and the
// funnel. Renders nothing until the seeker has applied somewhere; the hero's
// single call to action is the empty state.
import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Button } from '../../ui';
import ActivityChart from '../ActivityChart';
import HeatmapCalendar from '../HeatmapCalendar';
import FunnelChart from '../FunnelChart';
import type { AppliedJobDetail } from '../../../types';
import { Section, EdSection } from './shared';

export default function SearchSection() {
  const { currentUser, appliedJobs, dailyGoal } = useSeeker();
  const [details, setDetails] = useState<AppliedJobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!currentUser || appliedJobs.length === 0) return;
    let cancelled = false;
    setLoading(true); setError(null);
    fetch('/api/seeker/me/applied/details', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`Your funnel did not load (${r.status}).`); return r.json(); })
      .then((d: AppliedJobDetail[]) => { if (!cancelled) setDetails(Array.isArray(d) ? d : []); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Your funnel did not load.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, appliedJobs.length, attempt]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of details) { const s = d.stage || 'applied'; c[s] = (c[s] || 0) + 1; }
    return c;
  }, [details]);

  if (appliedJobs.length === 0) return null;

  return (
    <EdSection id="search" number="02" kicker="Your search" title="The last seven days">
    <div className="td-grid" style={{ paddingTop: 18 }}>
      <div className="td-col">
        <Section label="Last 7 days"><ActivityChart appliedJobs={appliedJobs} dailyGoal={dailyGoal} /></Section>
        <Section label="Funnel" sub={details.length ? `${details.length} tracked` : undefined}>
          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 11 }} aria-busy="true" />
          ) : error ? (
            <div className="jb-error rise" role="alert">
              <p className="jb-error__title">The funnel is taking a moment</p>
              <p className="jb-error__body">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => setAttempt(a => a + 1)} iconLeft={<RefreshCw size={13} />}>Try again</Button>
            </div>
          ) : (
            <FunnelChart stageCounts={stageCounts} totalApplied={details.length} />
          )}
        </Section>
      </div>
      <div className="td-col">
        <Section label="Activity"><HeatmapCalendar appliedJobs={appliedJobs} dailyGoal={dailyGoal} /></Section>
      </div>
    </div>
    </EdSection>
  );
}

'use client';
// FILE: src/components/seeker/today/index.tsx
// The signed-in home, set like a daily paper: a masthead with the date, the
// week board (the goal as stacked tiles, today on the right), four numbered
// picks, the search widgets once there is something to chart, and the news.
// No sidebar on this page; the board is the number.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import type { IJob } from '../../../types';
import { buildSkillsRegex } from '../JobDetailPanel';
import { BRAND } from '../../../theme/brand';
import Hero from './Hero';
import WeekBoard from './WeekBoard';
import PicksSection from './PicksSection';
import NewsSection from './NewsSection';
import SearchSection from './SearchSection';

export default function Today() {
  const { currentUser, userSkills, todayCount, dailyGoal, streak, appliedJobs, appliedJobIds, openSkillsEditor, saveDailyGoal } = useSeeker();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => { document.title = `Today · ${BRAND.appName}`; setNow(new Date()); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch('/api/seeker/jobs?limit=40', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`Roles did not load (${r.status}).`); return r.json(); })
      .then(j => { if (!cancelled) setJobs((j?.jobs || j || []).slice(0, 40)); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Roles did not load.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  const skillRe = useMemo(() => buildSkillsRegex(userSkills), [userSkills]);

  // Top four by skill matches; unmatched roles fill the remaining slots.
  const picks = useMemo(() => {
    if (!skillRe) return jobs.slice(0, 4);
    const scored = jobs.map(j => {
      const hay = `${j.JobTitle} ${j.DescriptionPlain || ''} ${(j.autoTags?.techStack || []).join(' ')}`;
      return { job: j, score: (hay.match(skillRe) || []).length };
    }).sort((a, b) => b.score - a.score);
    const matched = scored.filter(x => x.score > 0).slice(0, 4).map(x => x.job);
    const seen = new Set(matched.map(j => j._id));
    return [...matched, ...jobs.filter(j => !seen.has(j._id))].slice(0, 4);
  }, [jobs, skillRe]);

  const firstName = currentUser?.name?.split(' ')[0] || 'there';
  const hasHistory = appliedJobs.length > 0;

  return (
    <main className="daily">
      <div className="rise" style={{ '--i': 0 } as React.CSSProperties}>
        <Hero
          firstName={firstName}
          todayCount={todayCount}
          dailyGoal={dailyGoal}
          streak={streak}
          totalApplied={appliedJobs.length}
          now={now}
        />
      </div>

      <section className="daily__board rise" style={{ '--i': 1 } as React.CSSProperties} aria-label="This week">
        <p className="ed__kicker"><span className="ed__num">This week</span>one tile per application, today on the right</p>
        <WeekBoard appliedJobs={appliedJobs} dailyGoal={dailyGoal} onGoalChange={saveDailyGoal} />
        <p className="daily__tally">
          <span><b>{todayCount}</b> today</span>
          <span className="daily__tally-sep" aria-hidden>/</span>
          <span><b>{streak}</b> day streak</span>
          <span className="daily__tally-sep" aria-hidden>/</span>
          <span><b>{appliedJobs.length}</b> applied all time</span>
        </p>
      </section>

      <div className="rise" style={{ '--i': 2 } as React.CSSProperties}>
        <PicksSection
          picks={picks}
          loading={loading}
          error={error}
          onRetry={retry}
          userSkillsLength={userSkills.length}
          skillRe={skillRe}
          appliedJobIds={appliedJobIds}
          onOpenSkillsEditor={openSkillsEditor}
        />
      </div>
      {hasHistory && <div className="rise" style={{ '--i': 3 } as React.CSSProperties}><SearchSection /></div>}
      <div className="rise" style={{ '--i': hasHistory ? 4 : 3 } as React.CSSProperties}><NewsSection number={hasHistory ? '03' : '02'} /></div>
    </main>
  );
}

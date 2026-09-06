'use client';
// FILE: src/components/seeker/today/index.tsx
// The signed-in home. Two halves: *today* (greeting, goal ring, streak, the
// four picks) and *your search* (7-day chart, funnel, pipeline — the widgets
// that used to be /progress). News sits under the picks.

import { useEffect, useMemo, useState } from 'react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import SeekerWorkspace from '../SeekerWorkspace';
import type { IJob } from '../../../types';
import { buildSkillsRegex } from '../JobDetailPanel';
import { BRAND } from '../../../theme/brand';
import Hero from './Hero';
import PicksSection from './PicksSection';
import NewsSection from './NewsSection';
import SearchSection from './SearchSection';

export default function Today() {
  const { currentUser, userSkills, todayCount, dailyGoal, streak, appliedJobs, appliedJobIds, openSkillsEditor, saveDailyGoal } = useSeeker();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = `Today · ${BRAND.appName}`; }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/seeker/jobs?limit=40', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(j => { if (!cancelled) setJobs((j?.jobs || j || []).slice(0, 40)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SeekerWorkspace>
      <Hero
        greeting={greeting}
        firstName={firstName}
        todayCount={todayCount}
        dailyGoal={dailyGoal}
        streak={streak}
        totalApplied={appliedJobs.length}
        onGoalChange={saveDailyGoal}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PicksSection
          picks={picks}
          loading={loading}
          userSkillsLength={userSkills.length}
          skillRe={skillRe}
          appliedJobIds={appliedJobIds}
          onOpenSkillsEditor={openSkillsEditor}
        />
        <SearchSection />
        <NewsSection />
      </div>
    </SeekerWorkspace>
  );
}

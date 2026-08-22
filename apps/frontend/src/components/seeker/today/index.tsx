'use client';
// FILE: src/components/seeker/today/index.tsx
// Personalized home for logged-in users. Composes Hero + (Picks + News) + Sidebar.

import { useEffect, useMemo, useState } from 'react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { Container } from '../../ui';
import type { IJob } from '../../../types';
import { buildSkillsRegex } from '../JobDetailPanel';
import { BRAND } from '../../../theme/brand';
import Hero from './Hero';
import PicksSection from './PicksSection';
import NewsSection from './NewsSection';

export default function Today() {
  const { currentUser, userSkills, todayCount, dailyGoal, openSkillsEditor, saveDailyGoal } = useSeeker();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 900 : true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { document.title = `Today · ${BRAND.appName}`; }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/seeker/jobs?limit=40', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(j => {
        if (cancelled) return;
        setJobs((j?.jobs || j || []).slice(0, 40));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Pick top jobs matching skills
  const picks = useMemo(() => {
    const re = buildSkillsRegex(userSkills);
    if (!re) return jobs.slice(0, 4);
    return [...jobs]
      .map(j => {
        const hay = `${j.JobTitle} ${j.DescriptionPlain || ''} ${(j.autoTags?.techStack || []).join(' ')}`;
        const matches = (hay.match(re) || []).length;
        return { job: j, score: matches };
      })
      .sort((a, b) => b.score - a.score)
      .filter(x => x.score > 0)
      .slice(0, 4)
      .map(x => x.job)
      .concat(jobs.slice(0, 4))
      .slice(0, 4);
  }, [jobs, userSkills]);

  const firstName = currentUser?.name?.split(' ')[0] || 'there';
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <Hero
        isDesktop={isDesktop}
        greeting={greeting()}
        firstName={firstName}
        todayCount={todayCount}
        dailyGoal={dailyGoal}
        onGoalChange={saveDailyGoal}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
        <PicksSection
          picks={picks}
          loading={loading}
          userSkillsLength={userSkills.length}
          onOpenSkillsEditor={openSkillsEditor}
        />
        <NewsSection />
      </div>
    </Container>
  );
}

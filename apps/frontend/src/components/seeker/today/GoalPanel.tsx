'use client';
// FILE: src/components/seeker/today/GoalPanel.tsx
// The seeker's sidebar on the Pipeline and Profile pages: the week board at
// sidebar size, one tally line, and quiet links to the other account pages.
// No name here: identity lives in the nav.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import type { AppliedJobEntry } from '../../../types';
import WeekBoard from './WeekBoard';

interface Props {
  appliedJobs: AppliedJobEntry[];
  todayCount: number;
  dailyGoal: number;
  streak: number;
  onGoalChange: (n: number) => void;
}

const PAGES = [
  { to: '/today', label: 'Today' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/profile', label: 'Profile' },
] as const;

export default function GoalPanel({ appliedJobs, todayCount, dailyGoal, streak, onGoalChange }: Props) {
  const pathname = usePathname();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');
  const others = PAGES.filter(p => !isActive(p.to));
  const left = dailyGoal - todayCount;
  const headline = left < 0 ? 'Past the goal' : left === 0 ? 'Done for today' : left === 1 ? 'One to go' : `${left} to go`;

  return (
    <aside className="glass ws-side gp-card">
      <p className="gp__eyebrow">This week</p>
      <p className="font-display gp__headline">{headline}</p>
      <WeekBoard appliedJobs={appliedJobs} dailyGoal={dailyGoal} onGoalChange={onGoalChange} compact />
      <p className="daily__tally daily__tally--sm">
        <span><b>{todayCount}</b> today</span>
        <span className="daily__tally-sep" aria-hidden>/</span>
        <span><b>{streak}</b> day streak</span>
        <span className="daily__tally-sep" aria-hidden>/</span>
        <span><b>{appliedJobs.length}</b> applied</span>
      </p>
      <nav className="gp__nav" aria-label="Account">
        {others.map(p => (
          <Link key={p.to} href={p.to} className="gp__link press press--sm">
            {p.label} <ArrowRight size={12} aria-hidden />
          </Link>
        ))}
      </nav>
    </aside>
  );
}

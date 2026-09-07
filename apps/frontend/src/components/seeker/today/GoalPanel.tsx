'use client';
// FILE: src/components/seeker/today/GoalPanel.tsx
// The seeker's sidebar on the Pipeline and Profile pages: the week board at
// sidebar size and one tally line.
// No name here: identity lives in the nav.
import type { AppliedJobEntry } from '../../../types';
import WeekBoard from './WeekBoard';

interface Props {
  appliedJobs: AppliedJobEntry[];
  todayCount: number;
  dailyGoal: number;
  streak: number;
  onGoalChange: (n: number) => void;
}

export default function GoalPanel({ appliedJobs, todayCount, dailyGoal, streak, onGoalChange }: Props) {
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
    </aside>
  );
}

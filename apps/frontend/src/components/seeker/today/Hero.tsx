'use client';
// FILE: src/components/seeker/today/Hero.tsx
// The top of Today: a greeting in the serif voice, one sentence that says
// what is left to do, and the goal ring with the three numbers that used to
// live on /progress — streak, total applied, goal.
import { Flame, Briefcase, Target } from 'lucide-react';
import ProgressRing from '../ProgressRing';
import { eyebrowStyle } from './shared';

interface Props {
  greeting: string;
  firstName: string;
  todayCount: number;
  dailyGoal: number;
  streak: number;
  totalApplied: number;
  onGoalChange: (n: number) => void;
}

function lede(todayCount: number, dailyGoal: number, streak: number): string {
  const left = dailyGoal - todayCount;
  if (left <= 0) return streak > 1 ? `Today is done — that's ${streak} days running.` : 'Today is done. Anything more is a bonus.';
  if (todayCount === 0) return left === 1 ? 'One application and today counts.' : `${left} applications and today counts.`;
  return left === 1 ? 'One more and today is done.' : `${left} more and today is done.`;
}

export default function Hero({ greeting, firstName, todayCount, dailyGoal, streak, totalApplied, onGoalChange }: Props) {
  return (
    <div className="td-hero">
      <div className="td-hero__copy">
        <p style={eyebrowStyle}>{greeting}</p>
        <h1 className="font-display td-hero__title">{firstName}.</h1>
        <p className="td-hero__lede">{lede(todayCount, dailyGoal, streak)}</p>
      </div>

      <div className="glass ws-section td-ring">
        <ProgressRing todayCount={todayCount} dailyGoal={dailyGoal} onGoalChange={onGoalChange} />
        <div className="td-stats">
          <div><div className="td-stat__v"><Flame size={16} style={{ color: streak > 0 ? 'var(--thread-amber)' : 'var(--ink-faint)' }} />{streak}</div><div className="td-stat__l">Day streak</div></div>
          <div><div className="td-stat__v"><Briefcase size={15} style={{ color: 'var(--ink-faint)' }} />{totalApplied}</div><div className="td-stat__l">Applied</div></div>
          <div><div className="td-stat__v"><Target size={15} style={{ color: 'var(--ink-faint)' }} />{dailyGoal}</div><div className="td-stat__l">Per day</div></div>
        </div>
      </div>
    </div>
  );
}

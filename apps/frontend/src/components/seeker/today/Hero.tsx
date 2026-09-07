'use client';
// FILE: src/components/seeker/today/Hero.tsx
// The top of Today: the greeting in the serif voice, one line that speaks to
// where the seeker is (never a number, the sidebar owns those), and a single
// way forward. One action, not three.
import { ArrowRight } from 'lucide-react';
import { Button } from '../../ui';
import { eyebrowStyle } from './shared';

interface Props {
  greeting: string;
  firstName: string;
  todayCount: number;
  dailyGoal: number;
  streak: number;
  totalApplied: number;
}

/** One sentence for the moment the seeker is in. No counts: the ring already says them. */
export function voiceLine({ todayCount, dailyGoal, streak, totalApplied, hour }: {
  todayCount: number; dailyGoal: number; streak: number; totalApplied: number; hour: number;
}): string {
  const left = dailyGoal - todayCount;
  if (left < 0) return 'Past the goal. Tomorrow starts ahead.';
  if (left === 0) return streak > 1 ? 'Done, and the streak holds.' : 'Today is done. Anything more is a bonus.';
  if (totalApplied === 0) return 'The first application is the hardest. Start there.';
  if (todayCount === 0 && streak === 0) return 'Streaks restart with one. Today works.';
  if (todayCount === 0) return hour >= 18 ? 'Still time for one before the day closes.' : 'Pick one role you would actually take. Send it.';
  if (left === 1) return 'One more closes the loop.';
  return 'Good pace. Keep it moving.';
}

export default function Hero({ greeting, firstName, todayCount, dailyGoal, streak, totalApplied }: Props) {
  const line = voiceLine({ todayCount, dailyGoal, streak, totalApplied, hour: new Date().getHours() });
  const done = todayCount >= dailyGoal;
  return (
    <div className="td-hero">
      <div className="td-hero__copy">
        <p style={eyebrowStyle}>{greeting}</p>
        <h1 className="font-display td-hero__title">{firstName}.</h1>
        <p className="td-hero__lede">{line}</p>
      </div>
      <div className="td-hero__cta">
        <Button as="a" href="/jobs" variant={done ? 'secondary' : 'primary'} size="md" iconRight={<ArrowRight size={14} />}>
          {done ? 'Browse anyway' : 'Find a role'}
        </Button>
      </div>
    </div>
  );
}

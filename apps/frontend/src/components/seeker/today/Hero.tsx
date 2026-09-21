'use client';
// FILE: src/components/seeker/today/Hero.tsx
// The masthead. Today reads like a daily paper: the date set large in the
// serif, a mono dateline with the greeting, one sentence for the moment the
// seeker is in, and a single way forward. No numbers here; the board has them.
import { ArrowRight } from 'lucide-react';
import { Button } from '../../ui';

interface Props {
  firstName: string;
  todayCount: number;
  dailyGoal: number;
  streak: number;
  totalApplied: number;
  now: Date | null;
}

/** One sentence for the moment the seeker is in. Never a count: the board says those. */
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

export default function Hero({ firstName, todayCount, dailyGoal, streak, totalApplied, now }: Props) {
  const hour = now ? now.getHours() : 12;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const line = voiceLine({ todayCount, dailyGoal, streak, totalApplied, hour });
  const done = todayCount >= dailyGoal;
  const weekday = now ? now.toLocaleDateString('en-IN', { weekday: 'long' }) : '';
  const rest = now ? now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '';

  return (
    <header className="mh">
      <p className="mh__dateline">
        <span>The daily</span>
        <span className="mh__sep" aria-hidden>/</span>
        <span>{greeting}, {firstName}</span>
      </p>
      <div className="mh__row">
        <h1 className="font-display mh__date" aria-label={now ? `${weekday}, ${rest}` : 'Today'}>
          <span className="mh__word">{weekday || 'Today'}</span>
          {rest && <span className="mh__word mh__word--muted">{rest}</span>}
        </h1>
        <div className="mh__aside">
          <p className="mh__line">{line}</p>
          <Button as="a" href="/jobs" variant={done ? 'secondary' : 'primary'} size="md" iconRight={<ArrowRight size={14} />}>
            {done ? 'Browse anyway' : 'Find a role'}
          </Button>
        </div>
      </div>
    </header>
  );
}

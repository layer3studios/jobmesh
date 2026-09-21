'use client';
// FILE: src/components/seeker/today/WeekBoard.tsx
// The daily goal as a week of stacked tiles: seven columns (the last seven
// days, today on the right), one tile per application, filling upward toward
// a dashed goal line. The streak is visible as a run of full columns; nothing
// needs a legend. The goal is set on the board itself with the − / + at the
// end of the goal line, so there is no form. `compact` is the sidebar size.
import { Minus, Plus } from 'lucide-react';
import type { AppliedJobEntry } from '../../../types';
import { getDayBuckets } from '../../../utils/progress';

interface Props {
  appliedJobs: AppliedJobEntry[];
  dailyGoal: number;
  onGoalChange: (n: number) => void;
  compact?: boolean;
}

const MIN_GOAL = 1;
const MAX_GOAL = 12;

export default function WeekBoard({ appliedJobs, dailyGoal, onGoalChange, compact = false }: Props) {
  const buckets = getDayBuckets(appliedJobs, 7);
  const goal = Math.max(MIN_GOAL, Math.min(MAX_GOAL, dailyGoal));
  const today = buckets[buckets.length - 1];
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className={`wb${compact ? ' wb--compact' : ''}`} style={{ '--goal': goal } as React.CSSProperties}>
      <div className="wb__goal">
        <span className="wb__goal-line" aria-hidden />
        <span className="wb__goal-label">Goal {goal}/day</span>
        <span className="wb__goal-ctl">
          <button type="button" className="wb__btn press press--sm" aria-label="Lower goal" disabled={goal <= MIN_GOAL} onClick={() => onGoalChange(goal - 1)}><Minus size={12} /></button>
          <button type="button" className="wb__btn press press--sm" aria-label="Raise goal" disabled={goal >= MAX_GOAL} onClick={() => onGoalChange(goal + 1)}><Plus size={12} /></button>
        </span>
      </div>

      <div className="wb__grid" role="img" aria-label={`${today.count} of ${goal} applications today. ${buckets.filter(b => b.count >= goal).length} of the last 7 days hit the goal.`}>
        {buckets.map((b, ci) => {
          const filled = Math.min(goal, b.count);
          const over = Math.max(0, b.count - goal);
          const met = b.count >= goal;
          return (
            <div
              key={b.date.getTime()}
              className="wb__col"
              data-today={b.isToday ? 'true' : 'false'}
              data-met={met ? 'true' : 'false'}
              data-empty={b.count === 0 ? 'true' : 'false'}
              title={`${fmt(b.date)} · ${b.count} ${b.count === 1 ? 'application' : 'applications'}`}
            >
              <span className="wb__over" aria-hidden>{over > 0 ? `+${over}` : ''}</span>
              <div className="wb__stack">
                {Array.from({ length: goal }).map((_, i) => {
                  const on = i < filled;
                  return (
                    <span
                      key={i}
                      className="wb__tile"
                      data-on={on ? 'true' : 'false'}
                      style={{ '--k': ci * goal + i } as React.CSSProperties}
                    />
                  );
                })}
              </div>
              <span className="wb__day">{b.isToday ? 'Today' : b.dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';
// FILE: src/components/employer/dashboard/ActivityCard.tsx
// Right column: "Upcoming interviews" (count-only mini card — the summary
// endpoint returns just interviewsThisWeek; individual rows come later when
// the backend grows an upcomingInterviews array) and the "Recent activity"
// timeline (colour-coded dots per event type). Only the event LIST scrolls —
// the card header stays put, and the page never scrolls just because the feed
// is long.

import { CalendarDays } from 'lucide-react';
import { formatCompactDuration } from '@/components/employer/jobs/score-badge-helpers';
import type { DashboardActivityEvent } from '@/types/employer-dashboard';
import { DashboardCard } from './DashboardCard';

// Hard cap so the list scrolls internally no matter what the flex chain does.
const ACTIVITY_LIST_MAX_HEIGHT = 'calc(100vh - 340px)';

const DOT_COLOR: Record<DashboardActivityEvent['type'], string> = {
  application: 'var(--cat-green)',
  stage_move: 'var(--cat-blue)',
  interview_booked: 'var(--cat-blue)',
  interview_cancelled: 'var(--cat-amber)',
  score_completed: 'var(--cat-green)',
};

const name = (event: DashboardActivityEvent) => event.candidateName ?? 'A candidate';

function eventText(event: DashboardActivityEvent): { bold: string; rest: string } {
  switch (event.type) {
    case 'application': return { bold: name(event), rest: ` applied to ${event.postingTitle ?? 'a posting'}` };
    case 'stage_move': return { bold: name(event), rest: ` moved to ${event.toStage ?? 'a new stage'}` };
    case 'interview_booked': return { bold: name(event), rest: ' booked an interview' };
    case 'interview_cancelled': return { bold: name(event), rest: "'s interview cancelled" };
    case 'score_completed': return { bold: name(event), rest: ` scored ${event.score ?? '—'} on ${event.postingTitle ?? 'a posting'}` };
  }
}

export function UpcomingInterviewsCard({ count }: { count: number }) {
  return (
    <DashboardCard title="Upcoming interviews">
      {/* min-height so the empty "no interviews" state reads as a real card
          rather than a collapsed afterthought; real rows grow past it. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', minHeight: 120 }}>
        <CalendarDays size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)' }}>
          {count === 0
            ? 'No interviews this week.'
            : `You have ${count} interview${count === 1 ? '' : 's'} scheduled this week.`}
        </p>
      </div>
    </DashboardCard>
  );
}

export function ActivityCard({ events, fill }: {
  events: DashboardActivityEvent[];
  /** Desktop: fill the leftover column height and scroll the list internally. */
  fill?: boolean;
}) {
  return (
    <DashboardCard
      title="Recent activity"
      fill={fill}
      bodyMaxHeight={fill ? ACTIVITY_LIST_MAX_HEIGHT : undefined}
    >
      {events.length === 0 ? (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
          No activity yet. Start by creating a posting.
        </p>
      ) : (
        <div>
          {events.map((event, index) => {
            const text = eventText(event);
            return (
              <div key={`${event.type}-${event.timestamp}-${index}`} data-testid={`activity-${event.type}`}
                style={{ display: 'flex', gap: 8, padding: '9px 16px', borderBottom: '0.5px solid var(--border)' }}>
                <span data-testid="activity-dot" aria-hidden style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: DOT_COLOR[event.type],
                }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--ink)' }}>
                    <span style={{ fontWeight: 500 }}>{text.bold}</span>{text.rest}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)', marginTop: 1 }}>
                    {formatCompactDuration(event.timestamp)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

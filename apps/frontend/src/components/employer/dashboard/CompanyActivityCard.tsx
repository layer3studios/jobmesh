'use client';
// FILE: src/components/employer/dashboard/CompanyActivityCard.tsx
// Company-wide activity: who did what, to which candidate, on which posting —
// across every posting rather than one candidate's timeline.
//
// Each row reads as a sentence, and the actor leads it, because the question this
// card answers is "what is my team doing", not "what happened to this candidate".
// Events nobody performed (an application arriving) name the candidate instead.

import { useCallback, useEffect, useState } from 'react';
import { FileText, MoveRight, Archive, MessageSquare, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCompactDuration } from '@/components/employer/jobs/score-badge-helpers';
import { fetchCompanyActivity } from '@/api/employer-activity-api';
import type { CompanyActivityItem, CompanyActivityType } from '@/api/employer-activity-api';
import { DashboardCard } from './DashboardCard';

const PAGE_SIZE = 25;

const ICON: Record<CompanyActivityType, typeof FileText> = {
  application_received: FileText,
  stage_move: MoveRight,
  archive: Archive,
  note: MessageSquare,
  interview_scheduled: CalendarDays,
};
const ICON_COLOR: Record<CompanyActivityType, string> = {
  application_received: 'var(--cat-green)',
  stage_move: 'var(--cat-blue)',
  archive: 'var(--cat-amber)',
  note: 'var(--cat-purple)',
  interview_scheduled: 'var(--cat-indigo)',
};

const candidate = (item: CompanyActivityItem) => item.candidateName ?? 'a candidate';
const actor = (item: CompanyActivityItem) => item.actorName ?? 'Someone';

/** One activity line, in the interface's voice: subject, verb, object, posting. */
function describe(item: CompanyActivityItem): string {
  switch (item.type) {
    case 'application_received':
      return `${candidate(item)} applied`;
    case 'stage_move':
      return `${actor(item)} moved ${candidate(item)} to ${item.details.toStage ?? 'a new stage'}`;
    case 'archive':
      return `${actor(item)} archived ${candidate(item)}`;
    case 'note':
      return `${actor(item)} noted on ${candidate(item)}: “${item.details.note ?? ''}”`;
    case 'interview_scheduled':
      return `${candidate(item)} booked an interview`;
    default:
      return candidate(item);
  }
}

export default function CompanyActivityCard() {
  const [items, setItems] = useState<CompanyActivityItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  const loadPage = useCallback(async (before: string | null) => {
    setIsLoading(true);
    try {
      const page = await fetchCompanyActivity({ limit: PAGE_SIZE, before });
      setItems((prev) => (before ? [...prev, ...page.items] : page.items));
      setCursor(page.nextBefore);
      setHasFailed(false);
    } catch {
      setHasFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadPage(null); }, [loadPage]);

  return (
    <DashboardCard title="Activity">
      {hasFailed && items.length === 0 ? (
        <div style={{ padding: '18px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-2)' }}>
            Couldn’t load activity.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void loadPage(null)}>Retry</Button>
        </div>
      ) : items.length === 0 && !isLoading ? (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
          Nothing yet. Activity appears here as your team moves candidates through the pipeline.
        </p>
      ) : (
        <div>
          {items.map((item, index) => {
            const Icon = ICON[item.type] ?? FileText;
            return (
              <div key={`${item.type}-${item.timestamp}-${index}`}
                style={{ display: 'flex', gap: 9, padding: '8px 16px', borderBottom: '0.5px solid var(--border)' }}>
                <Icon size={14} aria-hidden="true"
                  style={{ marginTop: 2, flexShrink: 0, color: ICON_COLOR[item.type] ?? 'var(--ink-faint)' }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--ink)' }}>{describe(item)}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)', marginTop: 1 }}>
                    {item.postingTitle ? `${item.postingTitle} · ` : ''}{formatCompactDuration(item.timestamp)}
                  </span>
                </span>
              </div>
            );
          })}
          {cursor && (
            <div style={{ padding: '8px 16px' }}>
              <Button variant="ghost" size="sm" disabled={isLoading}
                onClick={() => void loadPage(cursor)}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

'use client';
// FILE: src/components/employer/jobs/InterviewDayDetailPanel.tsx
// The card below the calendar for the selected date: heading + counts, that
// date's existing times as compact inline chips, the date's meeting link(s)
// on ONE line below them (a link belongs to the date, not to each chip), the
// cancelled toggle, and the add flow. Past dates render read-only.

import { useState } from 'react';
import { CalendarDays, Video } from 'lucide-react';
import { Button, Stack, useToast } from '@/components/ui';
import { removeInterviewTime, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewTime } from '@/types/employer-interviews';
import { formatInterviewDayHeading } from '@/utils/format-interview-time';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import { todayIstDate } from './interview-calendar-helpers';
import { activeTimesOnDate, inactiveTimesOnDate, summarizeLinks, shortLink } from './day-time-helpers';
import InterviewTimeChip from './InterviewTimeChip';
import InterviewDayAddTimes from './InterviewDayAddTimes';
import type { AddTimesForm } from './useAddTimesForm';

const dayHeading = (dateIso: string): string => {
  const utcIso = istLocalToUtcIso(`${dateIso}T12:00`);
  return utcIso ? formatInterviewDayHeading(utcIso) : dateIso;
};

export default function InterviewDayDetailPanel({
  postingId, dateIso, times, durationMinutes, durationSaved,
  form, onFormChange, onFormUsed, syncDefaults, refetch,
}: {
  postingId: string;
  dateIso: string;
  times: InterviewTime[];
  durationMinutes: number;
  durationSaved: boolean;
  form: AddTimesForm;
  onFormChange: <K extends keyof AddTimesForm>(key: K, value: AddTimesForm[K]) => void;
  onFormUsed: () => void;
  syncDefaults: (form: AddTimesForm) => Promise<void>;
  refetch: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [showCancelled, setShowCancelled] = useState(false);
  const isPast = dateIso < todayIstDate();

  const activeTimes = activeTimesOnDate(times, dateIso);
  const cancelledTimes = inactiveTimesOnDate(times, dateIso);
  const availableCount = activeTimes.filter((time) => time.status === 'available').length;
  const bookedCount = activeTimes.length - availableCount;
  const links = summarizeLinks(activeTimes);

  async function handleRemove(timeId: string): Promise<void> {
    try {
      await removeInterviewTime(postingId, timeId);
      await refetch();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not remove that time.');
    }
  }

  return (
    <div data-testid="day-detail-panel" style={{ background: 'var(--surface-sunken)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 12, marginTop: 10 }}>
      <Stack gap={10}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <CalendarDays size={15} style={{ color: 'var(--ink-2)' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{dayHeading(dateIso)}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-2)' }}>
            {availableCount} available · {bookedCount} booked
          </span>
        </div>

        {activeTimes.length > 0 && (
          <div data-testid="time-chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {activeTimes.map((time) => (
              <InterviewTimeChip key={time.id} time={time} onRemove={(id) => void handleRemove(id)} readOnly={isPast} />
            ))}
          </div>
        )}

        {/* The date's link(s) — once, not per chip. Multiple links get counts. */}
        {links.length > 0 && (
          <p data-testid="day-link-summary" style={{
            margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8,
            fontSize: 10, color: 'var(--ink-muted)',
          }}>
            {links.map(({ link, count }) => (
              <span key={link} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: 240 }}>
                <Video size={10} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortLink(link)}</span>
                {links.length > 1 && <span>({count} time{count === 1 ? '' : 's'})</span>}
              </span>
            ))}
          </p>
        )}

        {showCancelled && cancelledTimes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, opacity: 0.55 }}>
            {cancelledTimes.map((time) => (
              <InterviewTimeChip key={time.id} time={time} onRemove={() => {}} readOnly />
            ))}
          </div>
        )}
        {cancelledTimes.length > 0 && (
          <div>
            <Button variant="link" size="sm" onClick={() => setShowCancelled((current) => !current)}>
              {showCancelled ? 'Hide cancelled' : `Show ${cancelledTimes.length} cancelled`}
            </Button>
          </div>
        )}

        {isPast ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)' }}>This date is in the past.</p>
        ) : (
          <>
            {activeTimes.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)' }}>
                No times on this date. Tap times below to add availability. ↓
              </p>
            )}
            <InterviewDayAddTimes
              postingId={postingId}
              dateIso={dateIso}
              durationMinutes={durationMinutes}
              durationSaved={durationSaved}
              form={form}
              onFormChange={onFormChange}
              onFormUsed={onFormUsed}
              syncDefaults={syncDefaults}
              existingTimes={times}
              onAdded={refetch}
            />
          </>
        )}
      </Stack>
    </div>
  );
}

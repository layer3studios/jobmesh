'use client';
// FILE: src/components/employer/jobs/InterviewSchedulingSettings.tsx
// Interview scheduling Settings tab, calendar edition: 240px details column on
// the left (pill toggles + summary card), mini month calendar + day detail
// panel on the right. Default selected date: today, or the next date with an
// available time. The per-date meeting link is per-session state, prefilled
// from the saved default and preserved across date/month switches.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, useToast } from '@/components/ui';
import { useIsNarrowViewport } from './useIsNarrowViewport';
import { listInterviewTimes } from '@/api/employer-interview-times-api';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewDefaults, InterviewTime } from '@/types/employer-interviews';
import { updateInterviewDefaults } from '@/api/employer-interview-times-api';
import { defaultSelectedDate, todayIstDate } from './interview-calendar-helpers';
import { useAddTimesForm, type AddTimesForm } from './useAddTimesForm';
import InterviewDetailsForm from './InterviewDetailsForm';
import InterviewPoolSummary from './InterviewPoolSummary';
import InterviewCalendarGrid from './InterviewCalendarGrid';
import InterviewDayDetailPanel from './InterviewDayDetailPanel';

// Viewport minus the nav, breadcrumb, tabs and card padding above this tab.
const TAB_CHROME_PIXELS = 120;

export default function InterviewSchedulingSettings({ posting }: { posting: Posting }) {
  const { showToast } = useToast();
  const narrow = useIsNarrowViewport();
  const [defaults, setDefaults] = useState<InterviewDefaults | null>(posting.interviewDefaults ?? null);
  const [times, setTimes] = useState<InterviewTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const today = todayIstDate();
    return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  });
  const { form, update: updateForm, rememberUsed } = useAddTimesForm(selectedDate, times);

  /**
   * The backend snapshots a time's mode / locationText from the posting
   * defaults and accepts only meetingUrl per time, so a batch's type is
   * applied by writing it to the defaults immediately before the POST.
   * Times already created keep their own snapshot — that is what lets Monday
   * be video and Wednesday a phone screen.
   */
  const syncDefaults = useCallback(async (next: AddTimesForm) => {
    const saved: InterviewDefaults = {
      mode: next.mode,
      durationMinutes: defaults?.durationMinutes ?? 45,
      timezoneId: defaults?.timezoneId ?? 'Asia/Kolkata',
      meetingUrl: next.mode === 'video' ? next.meetingUrl.trim() || null : null,
      locationText: next.mode === 'in_person' ? next.address.trim() || null : null,
      phoneNumber: next.mode === 'phone' ? next.phoneNumber.trim() || null : null,
      phoneCallDirection: next.mode === 'phone' ? next.phoneCallDirection : null,
      arrivalInstructions: next.mode === 'in_person' ? next.arrivalInstructions.trim() || null : null,
    };
    await updateInterviewDefaults(posting.id, saved);
    setDefaults(saved);
  }, [posting.id, defaults]);

  // Pick the initial date once the FIRST load lands (today, or the next date
  // with an available time); refetches never reset the selection.
  const initializedRef = useRef(false);
  const refetch = useCallback(async () => {
    try {
      const rows = await listInterviewTimes(posting.id, { includePast: true });
      setTimes(rows);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setSelectedDate(defaultSelectedDate(rows));
      }
    } catch {
      showToast('error', 'Could not load interview times.');
    }
  }, [posting.id, showToast]);
  useEffect(() => { void refetch(); }, [refetch]);

  function handleSaved(saved: InterviewDefaults): void {
    setDefaults(saved);
  }

  // Desktop: the whole tab is pinned to the viewport and clipped, so the PAGE
  // can never scroll no matter how much lands in the day panel. Mobile keeps
  // natural flow (stacked columns are meant to scroll the page).
  const lockedCard = narrow ? {} : {
    height: `calc(100vh - ${TAB_CHROME_PIXELS}px)`, overflow: 'hidden', boxSizing: 'border-box' as const,
  };
  const columnHeight = narrow ? {} : { height: '100%', minHeight: 0 };

  return (
    <Card style={{ width: '100%', ...lockedCard }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        ...(narrow ? {} : { height: '100%', minHeight: 0 }),
      }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Interview scheduling</h3>
        {!defaults && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            Configure your interview details and add available times to enable one-click scheduling.
          </p>
        )}
        {/* NO wrapping on desktop: a wrapping flex line is sized from content,
            so the columns would never inherit this row's height. */}
        <div style={{
          display: 'flex', gap: 24, width: '100%',
          flexWrap: narrow ? 'wrap' : 'nowrap',
          alignItems: narrow ? 'flex-start' : 'stretch',
          ...(narrow ? {} : { flex: 1, minHeight: 0, overflow: 'hidden' }),
        }}>
          {/* Left — details + summary. Scrolls on its own if ever too tall. */}
          <div
            className={narrow ? undefined : 'panel-scroll'}
            style={{
              flex: '0 0 200px', width: 200, display: 'flex', flexDirection: 'column', gap: 14,
              ...columnHeight, ...(narrow ? {} : { overflowY: 'auto' }),
            }}
          >
            <InterviewDetailsForm
              postingId={posting.id}
              initialDefaults={defaults}
              onSaved={handleSaved}
            />
            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
              <InterviewPoolSummary times={times} />
            </div>
          </div>
          {/* Right — fixed calendar on top, scrolling day detail below. */}
          <div style={{
            flex: '1 1 420px', minWidth: 340, display: 'flex', flexDirection: 'column',
            ...columnHeight, ...(narrow ? {} : { overflow: 'hidden' }),
          }}>
            <div style={{ flexShrink: 0 }}>
              <InterviewCalendarGrid
                year={viewMonth.year}
                month={viewMonth.month}
                times={times}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMonthChange={setViewMonth}
              />
            </div>
            {selectedDate && (
              // THE scroll region: 6 times + 20 chips scroll here, not the page.
              <div
                className={narrow ? undefined : 'panel-scroll'}
                style={narrow ? undefined : { flex: 1, minHeight: 0, overflowY: 'auto' }}
              >
                <InterviewDayDetailPanel
                  postingId={posting.id}
                  dateIso={selectedDate}
                  times={times}
                  durationMinutes={defaults?.durationMinutes ?? 45}
                  durationSaved={Boolean(defaults?.durationMinutes)}
                  form={form}
                  onFormChange={updateForm}
                  onFormUsed={rememberUsed}
                  syncDefaults={syncDefaults}
                  refetch={refetch}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

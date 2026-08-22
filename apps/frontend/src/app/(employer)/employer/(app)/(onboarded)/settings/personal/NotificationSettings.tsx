'use client';
// FILE: settings/personal/NotificationSettings.tsx
// Eight email events, grouped, each with a switch.
//
// AUTO-SAVE, BECAUSE A SWITCH THAT NEEDS A SAVE BUTTON IS LYING. Flipping it moves
// it; anything that leaves it looking on while it is still off is a worse bug than
// an extra request. The switch flips optimistically and REVERTS on failure, so the
// control never shows a state the server disagrees with.
//
// One in-flight key at a time is tracked rather than one global "saving" flag: the
// user can flip four switches quickly, and disabling the whole list while the first
// request lands would feel broken.

import { useState } from 'react';
import { Switch, useToast } from '@/components/ui';
import { updateNotificationPreferences } from '@/api/employer-me-api';
import { EmployerApiError } from '@/api/employer-api';
import type { NotificationPreferences, NotificationEventKey } from '@/context/employer/employer-context-types';
import { COPY } from '@/theme/brand';

const C = COPY.employer.personal;

interface EventGroup {
  label: string;
  events: Array<{ key: NotificationEventKey; label: string; hint: string }>;
}

// Grouped by WHEN the user is thinking about them, not by which service sends them.
const GROUPS: EventGroup[] = [
  { label: C.groupApplications, events: [
    { key: 'newApplication', label: C.eventNewApplication, hint: C.eventNewApplicationHint },
    { key: 'stageChange', label: C.eventStageChange, hint: C.eventStageChangeHint },
    { key: 'candidateHired', label: C.eventCandidateHired, hint: C.eventCandidateHiredHint },
  ] },
  { label: C.groupInterviews, events: [
    { key: 'interviewScheduled', label: C.eventInterviewScheduled, hint: C.eventInterviewScheduledHint },
    { key: 'interviewReminder', label: C.eventInterviewReminder, hint: C.eventInterviewReminderHint },
    { key: 'feedbackSubmitted', label: C.eventFeedbackSubmitted, hint: C.eventFeedbackSubmittedHint },
  ] },
  { label: C.groupCollaboration, events: [
    { key: 'noteMention', label: C.eventNoteMention, hint: C.eventNoteMentionHint },
  ] },
  { label: C.groupDeadlines, events: [
    { key: 'applicationDeadline', label: C.eventApplicationDeadline, hint: C.eventApplicationDeadlineHint },
  ] },
];

const GROUP_LABEL_STYLE = {
  margin: '0 0 6px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
const ROW_STYLE = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  gap: 16, padding: '10px 0', borderBottom: '0.5px solid var(--border)',
};

export default function NotificationSettings({
  preferences, onChanged,
}: {
  preferences: NotificationPreferences;
  onChanged: () => Promise<void> | void;
}) {
  const { showToast } = useToast();
  // Optimistic overlay on top of the server's values. Cleared per key once the
  // session refresh brings the real value back.
  const [pending, setPending] = useState<Partial<NotificationPreferences>>({});
  const [busyKey, setBusyKey] = useState<NotificationEventKey | null>(null);

  const valueOf = (key: NotificationEventKey) => pending[key] ?? preferences[key];

  async function toggle(key: NotificationEventKey, next: boolean) {
    setPending((current) => ({ ...current, [key]: next }));
    setBusyKey(key);
    try {
      await updateNotificationPreferences({ [key]: next });
      await onChanged();
      setPending((current) => {
        const { [key]: _consumed, ...rest } = current;
        return rest;
      });
      showToast('success', C.notificationsSaved);
    } catch (error) {
      // Put the switch back where it was — a control showing "off" while the server
      // says "on" is how someone stops getting mentions without knowing why.
      setPending((current) => {
        const { [key]: _reverted, ...rest } = current;
        return rest;
      });
      showToast('error', error instanceof EmployerApiError ? error.message : C.notificationsFailed);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section>
      <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{C.notifications}</p>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink-faint)' }}>{C.notificationsHint}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p style={GROUP_LABEL_STYLE}>{group.label}</p>
            {group.events.map((event) => (
              <div key={event.key} style={ROW_STYLE}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{event.label}</div>
                  {/* The hint says WHEN this fires. "Stage change" alone leaves the
                      user guessing whether it means theirs or everyone's. */}
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{event.hint}</div>
                </div>
                <Switch
                  label={event.label}
                  checked={valueOf(event.key)}
                  disabled={busyKey === event.key}
                  onChange={(next) => void toggle(event.key, next)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

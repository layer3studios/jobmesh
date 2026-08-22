// FILE: tests/components/employer/jobs/InterviewCard.test.tsx
// Badge + action set per status, and manage-permission gating on the card.
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import InterviewCard from '@/components/employer/jobs/InterviewCard';
import type { Interview, InterviewStatus } from '@/types/employer-interviews';

function interview(status: InterviewStatus, overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status,
    proposedSlots: [
      { startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 },
      { startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45 },
    ],
    selectedSlotIndex: status === 'proposed' ? null : 0,
    startAtUtc: status === 'proposed' ? null : '2030-08-10T09:30:00.000Z',
    timezoneId: 'Asia/Kolkata', durationMinutes: 45, mode: 'video',
    meetingUrl: 'https://meet.google.com/abc', locationText: null,
    calendarSequence: 0, interviewerEmployerUserIds: [], createdByEmployerUserId: 'u1',
    bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', bookedAt: null,
    cancelledAt: null, cancelReason: null, createdAt: '2030-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(status: InterviewStatus, canManage = true, overrides: Partial<Interview> = {}) {
  return render(
    <InterviewCard interview={interview(status, overrides)} canManage={canManage} onReschedule={() => {}} onCancel={() => {}} />,
  );
}

describe('InterviewCard', () => {
  it('proposed: awaiting badge, IST slot lines, actions for managers', () => {
    renderCard('proposed');
    expect(screen.getByText('Awaiting candidate')).toBeTruthy();
    expect(screen.getByText('Sat 10 Aug, 3:00 PM IST')).toBeTruthy();
    expect(screen.getByText('Reschedule')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('scheduled: confirmed badge with the full weekday time and meeting link', () => {
    renderCard('scheduled');
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText('Saturday, 10 August 2030, 3:00 PM IST')).toBeTruthy();
    expect(screen.getByText(/meet\.google\.com/)).toBeTruthy();
    expect(screen.getByText('Reschedule')).toBeTruthy();
  });

  it('cancelled: muted badge, reason shown, no actions', () => {
    renderCard('cancelled', true, { cancelReason: 'Position filled' });
    expect(screen.getByText('Cancelled')).toBeTruthy();
    expect(screen.getByText('Reason: Position filled')).toBeTruthy();
    expect(screen.queryByText('Reschedule')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('completed and no_show: read-only historical rows', () => {
    renderCard('completed');
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText('Reschedule')).toBeNull();
    cleanup();
    renderCard('no_show');
    expect(screen.getByText('No-show')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('canManage=false hides Reschedule and Cancel on active statuses', () => {
    renderCard('scheduled', false);
    expect(screen.queryByText('Reschedule')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('never renders a raw ISO string', () => {
    const { container } = renderCard('scheduled');
    expect(container.textContent).not.toContain('2030-08-10T09:30');
  });
});

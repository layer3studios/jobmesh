// FILE: tests/components/employer/jobs/pool-reschedule.test.tsx
// Pool reschedule panel (checkbox pool), two-path cancel dialog, same-day/past
// guards, and the close-posting interview warning.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InterviewSection from '@/components/employer/jobs/InterviewSection';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import { ToastProvider } from '@/components/ui/Toast';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import type { Interview, InterviewTime } from '@/types/employer-interviews';
import type { Posting } from '@/types/employer-jobs';

vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { slug: 'acme' }, viewerRole: 'member' }),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ postingId: 'p1' }) }));
vi.mock('@/components/employer/jobs/useSchedulingPool', () => ({
  useSchedulingPool: () => ({ hasDefaults: pool.hasDefaults, availableCount: pool.availableCount, refetchPool: async () => {} }),
}));
let pool = { hasDefaults: true, availableCount: 3 };

let hookState: { interviews: Interview[]; activeInterview: Interview | null };
vi.mock('@/hooks/employer/useApplicantInterviews', () => ({
  useApplicantInterviews: () => ({
    interviews: hookState.interviews, loading: false, error: null,
    refetch: async () => {}, activeInterview: hookState.activeInterview,
    hasActiveInterview: hookState.activeInterview !== null,
  }),
}));

const calls: string[] = [];
const cancelInterview = vi.fn();
const proposeInterview = vi.fn();
const sendPoolSchedulingLink = vi.fn();
const listInterviewTimes = vi.fn();
vi.mock('@/api/employer-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interviews-api')>();
  return {
    ...actual,
    cancelInterview: (...args: unknown[]) => { calls.push('cancel'); return cancelInterview(...args); },
    proposeInterview: (...args: unknown[]) => { calls.push('propose'); return proposeInterview(...args); },
  };
});
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return {
    ...actual,
    sendPoolSchedulingLink: (...args: unknown[]) => { calls.push('send'); return sendPoolSchedulingLink(...args); },
    listInterviewTimes: (...args: unknown[]) => listInterviewTimes(...args),
  };
});

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status: 'scheduled',
    proposedSlots: [], selectedSlotIndex: 0, startAtUtc: '2030-08-10T09:30:00.000Z',
    timezoneId: 'Asia/Kolkata', durationMinutes: 45, mode: 'video',
    meetingUrl: 'https://meet.acme.in/x', locationText: null, calendarSequence: 1,
    interviewerEmployerUserIds: [], createdByEmployerUserId: 'u1',
    bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', bookedAt: '2030-08-01T00:00:00.000Z',
    cancelledAt: null, cancelReason: null, createdAt: '2030-08-01T00:00:00.000Z', source: 'pool',
    ...overrides,
  };
}

function poolTime(id: string, startAtUtc: string): InterviewTime {
  return {
    id, startAtUtc, durationMinutes: 45, timezoneId: 'Asia/Kolkata', status: 'available',
    mode: 'video', meetingUrl: 'https://meet.acme.in/x', locationText: null,
    bookedByApplicationId: null, bookedAt: null,
  };
}

const FIVE_TIMES = [
  poolTime('t1', '2030-08-02T04:00:00.000Z'), poolTime('t2', '2030-08-02T05:30:00.000Z'),
  poolTime('t3', '2030-08-02T09:15:00.000Z'), poolTime('t4', '2030-08-04T04:30:00.000Z'),
  poolTime('t5', '2030-08-04T09:30:00.000Z'),
];

function renderSection(active: Interview) {
  hookState = { interviews: [active], activeInterview: active };
  return render(
    <ToastProvider>
      <InterviewSection applicationId="a1" candidateName="Asha Rao" />
    </ToastProvider>,
  );
}

beforeEach(() => {
  cancelInterview.mockReset(); proposeInterview.mockReset();
  sendPoolSchedulingLink.mockReset(); listInterviewTimes.mockReset();
  calls.length = 0;
  pool = { hasDefaults: true, availableCount: 3 };
  cancelInterview.mockResolvedValue(interview({ status: 'cancelled' }));
  sendPoolSchedulingLink.mockResolvedValue(interview({ id: 'i2', status: 'proposed' }));
  proposeInterview.mockResolvedValue(interview({ id: 'i3', status: 'proposed' }));
  listInterviewTimes.mockResolvedValue(FIVE_TIMES);
  cleanup();
});

describe('PoolReschedulePanel', () => {
  it('shows available times grouped by date with checkboxes, all selected', async () => {
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    await waitFor(() => expect(screen.getByText('Fri, 2 August 2030')).toBeTruthy());
    expect(screen.getByText('Sun, 4 August 2030')).toBeTruthy();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6); // 5 times + select-all
    expect(checkboxes.every((box) => (box as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByText('Select all (5 available)')).toBeTruthy();
  });

  it('all selected + confirm → cancel then send-scheduling-link (pool path)', async () => {
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    await waitFor(() => expect(screen.getByText('Send 5 times')).toBeTruthy());
    fireEvent.click(screen.getByText('Send 5 times'));
    await waitFor(() => expect(calls).toEqual(['cancel', 'send']));
    expect(proposeInterview).not.toHaveBeenCalled();
  });

  it('2 of 5 selected + confirm → per-candidate propose with exactly those 2 times', async () => {
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    await waitFor(() => expect(screen.getByText('9:30 AM')).toBeTruthy());
    // Deselect three, keep 9:30 AM + 10:00 AM (t1 on Aug 2, t4 on Aug 4).
    fireEvent.click(screen.getByText('11:00 AM').querySelector('input') ?? screen.getByText('11:00 AM'));
    fireEvent.click(screen.getByText('2:45 PM'));
    fireEvent.click(screen.getByText('3:00 PM'));
    await waitFor(() => expect(screen.getByText('Send 2 times')).toBeTruthy());
    fireEvent.click(screen.getByText('Send 2 times'));
    await waitFor(() => expect(calls).toEqual(['cancel', 'propose']));
    const input = proposeInterview.mock.calls[0][1] as { proposedSlots: { startAtUtc: string }[] };
    expect(input.proposedSlots.map((slot) => slot.startAtUtc).sort()).toEqual(
      ['2030-08-02T04:00:00.000Z', '2030-08-04T04:30:00.000Z'].sort(),
    );
    expect(sendPoolSchedulingLink).not.toHaveBeenCalled();
  });
});

describe('CancelInterviewDialog two paths', () => {
  function openCancel() {
    renderSection(interview());
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Role changed' } });
  }

  it('shows both buttons; resend path calls cancel then send', async () => {
    openCancel();
    expect(screen.getByText('Cancel interview')).toBeTruthy();
    expect(screen.getByText('Cancel and send new scheduling link')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel and send new scheduling link'));
    await waitFor(() => expect(calls).toEqual(['cancel', 'send']));
    await waitFor(() => expect(screen.getByText('Cancelled and new scheduling link sent to Asha.')).toBeTruthy());
  });

  it('"Cancel and send new link" is disabled when the pool is empty', () => {
    pool = { hasDefaults: true, availableCount: 0 };
    openCancel();
    const resend = screen.getByText('Cancel and send new scheduling link').closest('button') as HTMLButtonElement;
    expect(resend.disabled).toBe(true);
    expect((screen.getByText('Cancel interview').closest('button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('a today-interview shows the extra warning', () => {
    const todayNoonIst = istLocalToUtcIso(`${new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10)}T23:50`) as string;
    hookState = { interviews: [], activeInterview: null };
    renderSection(interview({ startAtUtc: todayNoonIst }));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('This interview is scheduled for today. Are you sure you want to cancel?')).toBeTruthy();
  });

  it('a past interview has no Cancel button', () => {
    renderSection(interview({ startAtUtc: '2020-01-01T09:30:00.000Z' }));
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.queryByText('Reschedule')).toBeNull();
    expect(screen.getByText("This interview's time has passed.")).toBeTruthy();
  });
});

describe('close posting warning', () => {
  const posting: Posting = {
    id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'x', descriptionPlain: 'x',
    location: 'Bengaluru', workplaceType: 'onsite', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
    applicationDeadline: null, autoCloseOnDeadline: false,
    postedAt: null, closedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
    assignmentId: null,
  };

  it('shows the interview-cancellation line when booked interviews exist, not otherwise', async () => {
    listInterviewTimes.mockResolvedValue([
      { ...poolTime('b1', '2030-08-02T04:00:00.000Z'), status: 'booked' },
      { ...poolTime('b2', '2030-08-04T04:00:00.000Z'), status: 'booked' },
    ]);
    render(<ToastProvider><PostingOverview posting={posting} onReload={async () => {}} /></ToastProvider>);
    fireEvent.click(screen.getByText('Close posting'));
    await waitFor(() => expect(screen.getByText('2 scheduled interviews will be cancelled and candidates will be notified.')).toBeTruthy());
    cleanup();
    listInterviewTimes.mockResolvedValue([]);
    render(<ToastProvider><PostingOverview posting={posting} onReload={async () => {}} /></ToastProvider>);
    fireEvent.click(screen.getByText('Close posting'));
    await waitFor(() => expect(screen.getByText('Close this posting?')).toBeTruthy());
    expect(screen.queryByText(/will be cancelled and candidates/)).toBeNull();
  });
});

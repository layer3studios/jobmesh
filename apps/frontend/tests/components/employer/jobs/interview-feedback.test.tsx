// FILE: tests/components/employer/jobs/interview-feedback.test.tsx
// Post-interview feedback: prompt vs completed state, verdict selection,
// no-show branch, and the advance / archive follow-up nudges.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InterviewSection from '@/components/employer/jobs/InterviewSection';
import InterviewFeedbackPrompt from '@/components/employer/jobs/InterviewFeedbackPrompt';
import { ToastProvider } from '@/components/ui/Toast';
import type { Interview } from '@/types/employer-interviews';
import type { Stage } from '@/types/employer-applicants';

const HOUR_MS = 3600000;

const completeInterview = vi.fn();
const markNoShow = vi.fn();
vi.mock('@/api/employer-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interviews-api')>();
  return {
    ...actual,
    completeInterview: (...args: unknown[]) => completeInterview(...args),
    markNoShow: (...args: unknown[]) => markNoShow(...args),
  };
});
vi.mock('@/api/employer-applicants-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicants-api')>();
  return { ...actual, moveApplicant: vi.fn().mockResolvedValue({}) };
});
vi.mock('next/navigation', () => ({ useParams: () => ({ postingId: 'p1' }) }));
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => ({ viewerRole: 'founder' }) }));

const interviewsBox: { list: Interview[] } = { list: [] };
vi.mock('@/hooks/employer/useApplicantInterviews', () => ({
  useApplicantInterviews: () => ({
    interviews: interviewsBox.list, loading: false, error: null, refetch: vi.fn(),
    activeInterview: interviewsBox.list.find((i) => i.status === 'proposed' || i.status === 'scheduled') ?? null,
    hasActiveInterview: interviewsBox.list.some((i) => i.status === 'proposed' || i.status === 'scheduled'),
  }),
}));
vi.mock('@/components/employer/jobs/useSchedulingPool', () => ({
  useSchedulingPool: () => ({ hasDefaults: true, availableCount: 3, refetchPool: vi.fn() }),
}));

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status: 'scheduled',
    proposedSlots: [], selectedSlotIndex: null,
    startAtUtc: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
    timezoneId: 'Asia/Kolkata', durationMinutes: 45, mode: 'video', meetingUrl: 'https://m.x/1',
    locationText: null, calendarSequence: 0, interviewerEmployerUserIds: [],
    createdByEmployerUserId: null, bookingTokenExpiresAt: new Date().toISOString(),
    bookedAt: new Date().toISOString(), cancelledAt: null, cancelReason: null,
    createdAt: new Date().toISOString(), ...overrides,
  };
}

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Shortlisted', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

function renderPrompt() {
  return render(
    <ToastProvider>
      <InterviewFeedbackPrompt
        interview={interview()} candidateName="Ada Lovelace" stages={STAGES}
        onOutcome={vi.fn()} onArchiveRequested={vi.fn()}
      />
    </ToastProvider>,
  );
}

const LONG_FEEDBACK = 'Really solid answers throughout the interview.';

beforeEach(() => {
  completeInterview.mockReset();
  markNoShow.mockReset();
  interviewsBox.list = [];
});

describe('InterviewSection prompt gating', () => {
  it('renders the feedback prompt for a past, still-scheduled interview', () => {
    interviewsBox.list = [interview()];
    render(<ToastProvider><InterviewSection applicationId="a1" candidateName="Ada" stages={STAGES} /></ToastProvider>);
    expect(screen.getByText('How did it go?')).toBeTruthy();
  });

  it('renders the completed state (not the prompt) for an already-completed interview', () => {
    interviewsBox.list = [interview({
      status: 'completed', recommendation: 'strong_yes', feedbackText: 'Excellent depth.', completedAt: new Date().toISOString(),
    })];
    render(<ToastProvider><InterviewSection applicationId="a1" candidateName="Ada" stages={STAGES} /></ToastProvider>);
    expect(screen.queryByText('How did it go?')).toBeNull();
    expect(screen.getByText('Feedback submitted')).toBeTruthy();
    expect(screen.getByText('Strong yes')).toBeTruthy();
  });
});

describe('InterviewFeedbackPrompt', () => {
  it("selecting 'yes' enables submit only after 10+ chars of feedback", () => {
    renderPrompt();
    const submit = screen.getByRole('button', { name: 'Submit feedback' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(submit.disabled).toBe(true); // no feedback yet
    fireEvent.change(screen.getByPlaceholderText('What stood out? Any concerns?'), { target: { value: 'short' } });
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('What stood out? Any concerns?'), { target: { value: LONG_FEEDBACK } });
    expect(submit.disabled).toBe(false);
  });

  it('selecting no-show hides the feedback textarea', () => {
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(screen.getByPlaceholderText('What stood out? Any concerns?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /No-show/ }));
    expect(screen.queryByPlaceholderText('What stood out? Any concerns?')).toBeNull();
    expect((screen.getByRole('button', { name: 'Mark as no-show' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("submitting 'strong_yes' shows the advance follow-up", async () => {
    completeInterview.mockResolvedValue({ interview: interview(), nextAction: 'advance', suggestedStage: 's2' });
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Strong yes' }));
    fireEvent.change(screen.getByPlaceholderText('What stood out? Any concerns?'), { target: { value: LONG_FEEDBACK } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    await waitFor(() => expect(screen.getByText('Move Ada to Shortlisted?')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Move' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeTruthy();
  });

  it("submitting 'no' shows the archive follow-up", async () => {
    completeInterview.mockResolvedValue({
      interview: interview(), nextAction: 'archive', suggestedReason: 'Not a fit after interview',
    });
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.change(screen.getByPlaceholderText('What stood out? Any concerns?'), { target: { value: LONG_FEEDBACK } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    await waitFor(() => expect(screen.getByText('Archive Ada?')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy();
  });
});

// FILE: tests/components/employer/jobs/candidate-timeline.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CandidateTimeline from '@/components/employer/jobs/CandidateTimeline';
import type { TimelineEvent } from '@/types/employer-timeline';

const fetchTimeline = vi.fn();
vi.mock('@/api/employer-applicant-actions-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicant-actions-api')>();
  return { ...actual, fetchTimeline: (...args: unknown[]) => fetchTimeline(...args) };
});

const LONG_FEEDBACK = 'Very strong on system design; some gaps in testing discipline but overall a clear hire signal from me.';

const EVENTS: TimelineEvent[] = [
  { type: 'note_added', text: 'Follow up next week', authorName: 'Grace Founder', timestamp: '2026-07-04T10:00:00Z' },
  { type: 'interview_completed', recommendation: 'strong_yes', feedbackText: LONG_FEEDBACK, timestamp: '2026-07-03T10:00:00Z' },
  { type: 'stage_move', fromStage: 'Applied', toStage: 'Shortlisted', actorName: 'Grace Founder', timestamp: '2026-07-02T10:00:00Z' },
  { type: 'scored', score: 82, timestamp: '2026-07-01T12:00:00Z' },
  { type: 'applied', timestamp: '2026-07-01T10:00:00Z' },
];

async function renderTimeline(events: TimelineEvent[] = EVENTS) {
  fetchTimeline.mockResolvedValue(events);
  render(<CandidateTimeline applicationId="a1" candidateName="Ada Lovelace" />);
  await waitFor(() => expect(screen.queryByTestId('timeline-skeleton')).toBeNull());
}

// Braces matter: a concise arrow would RETURN the mock (mockReset returns
// `this`), and vitest calls a function returned from beforeEach as cleanup —
// invoking the mock itself and leaking an unhandled rejection.
beforeEach(() => { fetchTimeline.mockReset(); });

describe('CandidateTimeline', () => {
  it('renders all events in backend order (newest first)', async () => {
    await renderTimeline();
    const rows = ['note_added', 'interview_completed', 'stage_move', 'scored', 'applied']
      .map((type) => screen.getByTestId(`timeline-${type}`));
    // Each row must precede the next in DOM order.
    for (let i = 0; i < rows.length - 1; i += 1) {
      expect(rows[i].compareDocumentPosition(rows[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(4);
    }
    expect(screen.getByText('Ada Lovelace applied')).toBeTruthy();
  });

  it('interview_completed events show expandable feedback', async () => {
    await renderTimeline();
    const row = screen.getByTestId('timeline-interview_completed');
    expect(within(row).getByText(/strong yes/)).toBeTruthy();
    const toggle = within(row).getByRole('button', { expanded: false });
    expect(toggle.textContent).toContain('…'); // collapsed preview
    fireEvent.click(toggle);
    expect(within(row).getByRole('button', { expanded: true }).textContent).toBe(LONG_FEEDBACK);
  });

  it('note events show the author name', async () => {
    await renderTimeline();
    expect(within(screen.getByTestId('timeline-note_added')).getByText(/Grace Founder:/)).toBeTruthy();
  });

  it('scored events show the score', async () => {
    await renderTimeline();
    expect(within(screen.getByTestId('timeline-scored')).getByText('AI scored 82/100')).toBeTruthy();
  });

  it('shows a retry on load failure', async () => {
    fetchTimeline.mockRejectedValue(new Error('boom'));
    render(<CandidateTimeline applicationId="a1" candidateName="Ada" />);
    await waitFor(() => expect(screen.getByText("Couldn't load timeline")).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ReviewConflictDialog from '@/components/employer/jobs/parts/ReviewConflictDialog';
import type { PendingReview } from '@/components/employer/jobs/parts/ReviewConflictDialog';
import type { AssignmentReview } from '@/types/employer-applicants';

const THEIR_REVIEWED_AT = '2026-08-04T11:58:00.000Z';

const theirReview: AssignmentReview = {
  id: 'r1',
  assignmentSubmissionId: 's1',
  reviewedByEmployerUserId: 'u-rahul',
  reviewedAt: THEIR_REVIEWED_AT,
  overallScore: 3,
  passesBar: false,
  reviewNotesMarkdown: 'Rate limiter works but the token refill is wrong under load.',
};

const myPending: PendingReview = {
  overallScore: 5,
  passesBar: true,
  reviewNotesMarkdown: 'Clean implementation, thoughtful trade-offs in the write-up.',
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof ReviewConflictDialog>> = {}) {
  const onKeepTheirs = vi.fn();
  const onReplace = vi.fn();
  render(
    <ReviewConflictDialog
      currentReview={overrides.currentReview === undefined ? theirReview : overrides.currentReview}
      conflictingReviewer={overrides.conflictingReviewer === undefined
        ? { name: 'Rahul Menon', email: 'rahul@acme.test' }
        : overrides.conflictingReviewer}
      pending={overrides.pending === undefined ? myPending : overrides.pending}
      isSubmitting={overrides.isSubmitting ?? false}
      onKeepTheirs={overrides.onKeepTheirs ?? onKeepTheirs}
      onReplace={overrides.onReplace ?? onReplace}
    />,
  );
  return { onKeepTheirs, onReplace };
}

beforeEach(() => cleanup());

describe('both reviews are shown', () => {
  it('renders nothing when there is no conflict', () => {
    renderDialog({ currentReview: null });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('labels the two columns "Your review" and "{name}\'s review"', () => {
    renderDialog();
    expect(screen.getByRole('region', { name: 'Your review' })).toBeTruthy();
    expect(screen.getByRole('region', { name: "Rahul Menon's review" })).toBeTruthy();
  });

  it('names the other reviewer and when they saved', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /Rahul Menon's review · saved/ })).toBeTruthy();
  });

  it('renders BOTH scores and verdicts, not just one', () => {
    renderDialog();
    const mine = screen.getByRole('region', { name: 'Your review' });
    const theirs = screen.getByRole('region', { name: "Rahul Menon's review" });
    expect(mine.textContent).toContain('5/5');
    expect(mine.textContent).toContain('Passed');
    expect(theirs.textContent).toContain('3/5');
    expect(theirs.textContent).toContain('Failed');
  });

  it('renders both sets of notes so the decision is informed', () => {
    renderDialog();
    expect(screen.getByText(/Clean implementation, thoughtful trade-offs/)).toBeTruthy();
    expect(screen.getByText(/token refill is wrong under load/)).toBeTruthy();
  });

  it('falls back to the email, then a generic label, when the name is missing', () => {
    renderDialog({ conflictingReviewer: { name: null, email: 'rahul@acme.test' } });
    expect(screen.getByRole('region', { name: "rahul@acme.test's review" })).toBeTruthy();
    cleanup();
    // A removed teammate leaves no user row; the review still stands.
    renderDialog({ conflictingReviewer: null });
    expect(screen.getByRole('region', { name: "A teammate's review" })).toBeTruthy();
  });
});

describe('the two actions', () => {
  // The reviewedAt from the 409 IS the override token — there is no force flag.
  it('"Replace with mine" submits with the reviewedAt from the conflict body', () => {
    const { onReplace } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Replace with mine' }));
    expect(onReplace).toHaveBeenCalledTimes(1);
    expect(onReplace).toHaveBeenCalledWith(THEIR_REVIEWED_AT);
  });

  it('"Keep theirs, discard mine" closes without any API call', () => {
    const { onKeepTheirs, onReplace } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Keep theirs, discard mine' }));
    expect(onKeepTheirs).toHaveBeenCalledTimes(1);
    expect(onReplace).not.toHaveBeenCalled();
  });

  it('Escape keeps theirs rather than replacing', () => {
    const { onKeepTheirs, onReplace } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onKeepTheirs).toHaveBeenCalledTimes(1);
    expect(onReplace).not.toHaveBeenCalled();
  });

  // This component never mutates the caller's draft — it only reports the choice.
  it('the reviewer\'s typed notes are still rendered after either action', () => {
    const { onKeepTheirs } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Keep theirs, discard mine' }));
    expect(onKeepTheirs).toHaveBeenCalled();
    // Still on screen: the parent decides when to close, and the draft is untouched.
    expect(screen.getByText(/Clean implementation, thoughtful trade-offs/)).toBeTruthy();
  });

  it('says nothing is discarded until they choose', () => {
    renderDialog();
    expect(screen.getByText(/nothing is discarded until you choose/i)).toBeTruthy();
  });

  it('locks both actions while the replace is in flight', () => {
    renderDialog({ isSubmitting: true });
    expect((screen.getByRole('button', { name: 'Keep theirs, discard mine' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('handles an empty-notes review on either side', () => {
    renderDialog({
      currentReview: { ...theirReview, reviewNotesMarkdown: '' },
      pending: { ...myPending, reviewNotesMarkdown: '' },
    });
    expect(screen.getAllByText('No notes.')).toHaveLength(2);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { submitAssignmentReview, getAssignmentFileDownloadUrl, showToast } = vi.hoisted(() => ({
  submitAssignmentReview: vi.fn(),
  getAssignmentFileDownloadUrl: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/api/employer-assignment-reviews-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignment-reviews-api')>()),
  submitAssignmentReview, getAssignmentFileDownloadUrl,
}));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));

import AssignmentReviewPanel from '@/components/employer/jobs/parts/AssignmentReviewPanel';
import { EmployerAssignmentReviewsApiError } from '@/api/employer-assignment-reviews-api';
import type { AssignmentReview, AssignmentSubmission } from '@/types/employer-applicants';

const ME = 'u-me';
const THEM = 'u-rahul';

function makeSubmission(overrides: Partial<AssignmentSubmission> = {}): AssignmentSubmission {
  return {
    id: 's1',
    applicationId: 'app1',
    jobId: 'j1',
    assignmentSnapshot: {
      title: 'Build a rate limiter',
      publicSummary: 'Token bucket.',
      descriptionMarkdown: '# The task\n\nImplement a token bucket.',
      submissionInstructionsMarkdown: 'Send a repo link.',
      estimatedHours: 3,
      allowedFileTypes: ['pdf'],
      sourceAssignmentId: 'a1',
      snapshottedAt: '2026-08-01T00:00:00.000Z',
    },
    profileLinks: { githubUrl: null, linkedinUrl: null },
    submittedAt: '2026-08-01T00:00:00.000Z',
    links: [{ url: 'https://github.com/asha/take-home', addedAt: null }],
    files: [{ fileId: 'f1', originalName: 'design.pdf', sizeBytes: 2048, mimeType: 'application/pdf', uploadedAt: null }],
    seekerNotesMarkdown: 'I focused on the refill maths.',
    filesDeletedAt: null,
    ...overrides,
  };
}

function makeReview(overrides: Partial<AssignmentReview> = {}): AssignmentReview {
  return {
    id: 'r1',
    assignmentSubmissionId: 's1',
    reviewedByEmployerUserId: THEM,
    reviewedAt: '2026-08-03T00:00:00.000Z',
    overallScore: 3,
    passesBar: false,
    reviewNotesMarkdown: 'Refill maths is wrong under load.',
    ...overrides,
  };
}

function renderPanel(props: Partial<React.ComponentProps<typeof AssignmentReviewPanel>> = {}) {
  return render(
    <AssignmentReviewPanel
      submission={props.submission ?? makeSubmission()}
      review={props.review === undefined ? null : props.review}
      currentEmployerUserId={props.currentEmployerUserId === undefined ? ME : props.currentEmployerUserId}
      onSaved={props.onSaved}
    />,
  );
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  getAssignmentFileDownloadUrl.mockImplementation(async () => ({ url: '/dl?token=x', expiresAt: 'x' }));
  submitAssignmentReview.mockImplementation(async () => makeReview({ reviewedByEmployerUserId: ME }));
  vi.stubGlobal('open', vi.fn());
});

describe('order and disclosure', () => {
  // Scoring before reading is the failure mode the whole layout is arranged against.
  it('renders task → submission → form in DOM order', () => {
    const { container } = renderPanel();
    const sections = Array.from(container.querySelectorAll('section')).map((node) => node.getAttribute('aria-label'));
    expect(sections).toEqual(['What the candidate saw', 'Submission', 'Your review form']);
  });

  it('the task accordion is CLOSED by default', () => {
    renderPanel();
    const toggle = screen.getByRole('button', { name: /What the candidate saw/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('heading', { name: 'The task' })).toBeNull();
  });

  it('opens the task on click and renders the snapshot as markdown', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /What the candidate saw/ }));
    const heading = screen.getByRole('heading', { name: 'The task' });
    expect(heading.tagName).toBe('H1');
  });

  it('shows the submission links and candidate notes', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: 'https://github.com/asha/take-home' })).toBeTruthy();
    expect(screen.getByText('I focused on the refill maths.')).toBeTruthy();
  });
});

describe('anchoring — a teammate review is collapsed pre-review', () => {
  it("collapses a TEAMMATE's review behind a disclosure", () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: THEM }) });
    expect(screen.getByRole('button', { name: 'A teammate has reviewed this — show' })).toBeTruthy();
    // The score is not on screen until they ask for it.
    expect(screen.queryByText('3/5')).toBeNull();
    expect(screen.queryByText(/Refill maths is wrong/)).toBeNull();
  });

  it('reveals it on request', () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: THEM }) });
    fireEvent.click(screen.getByRole('button', { name: 'A teammate has reviewed this — show' }));
    expect(screen.getByText('3/5')).toBeTruthy();
    expect(screen.getByText(/Refill maths is wrong/)).toBeTruthy();
  });

  it("leaves the form EMPTY — a teammate's score never seeds it", () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: THEM }) });
    for (const option of screen.getAllByRole('radio', { name: /^\d — / })) {
      expect(option.getAttribute('aria-checked')).toBe('false');
    }
  });

  it("renders the user's OWN prior review inline, not collapsed", () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: ME, overallScore: 4, passesBar: true }) });
    expect(screen.queryByRole('button', { name: 'A teammate has reviewed this — show' })).toBeNull();
    expect(screen.getByText('4/5')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit review' })).toBeTruthy();
  });

  it('editing an own review pre-fills the form from it', () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: ME, overallScore: 4, passesBar: true }) });
    fireEvent.click(screen.getByRole('button', { name: 'Edit review' }));
    expect(screen.getByRole('radio', { name: '4 — Strong' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('file downloads', () => {
  // The signed token lives ~15 minutes; anyone who actually reads the submission
  // first would blow through a URL minted on mount.
  it('does NOT fetch a download URL on mount', () => {
    renderPanel();
    expect(getAssignmentFileDownloadUrl).not.toHaveBeenCalled();
  });

  it('fetches it on click, showing a per-file spinner during the round trip', async () => {
    let resolveUrl: (value: { url: string; expiresAt: string }) => void = () => {};
    getAssignmentFileDownloadUrl.mockImplementation(() => new Promise((resolve) => { resolveUrl = resolve; }));
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(await screen.findByText('Preparing…')).toBeTruthy();

    resolveUrl({ url: '/dl?token=x', expiresAt: 'x' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy());
    expect(getAssignmentFileDownloadUrl).toHaveBeenCalledWith('s1', 'f1');
  });

  it('renders "Files were deleted" and NO download buttons once retention ran', () => {
    renderPanel({ submission: makeSubmission({ filesDeletedAt: '2026-08-03T00:00:00.000Z' }) });
    expect(screen.getByText('Files were deleted.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
  });

  it('a 410 on click reports the same message', async () => {
    getAssignmentFileDownloadUrl.mockImplementation(async () => {
      throw new EmployerAssignmentReviewsApiError(410, 'FILES_DELETED', 'These files have been deleted.');
    });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    await screen.findByText('Files were deleted.');
  });
});

describe('saving', () => {
  function fillForm() {
    fireEvent.click(screen.getByRole('radio', { name: '4 — Strong' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    fireEvent.change(screen.getByLabelText(/^Review notes/), { target: { value: 'Solid work.' } });
  }

  it('blocks the save until both a score and a verdict are chosen', () => {
    renderPanel();
    expect((screen.getByRole('button', { name: 'Save review' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Pick a score and whether they pass the bar.')).toBeTruthy();
  });

  it('submits with a null lock when nobody has reviewed yet', async () => {
    renderPanel();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }));
    await waitFor(() => expect(submitAssignmentReview).toHaveBeenCalledWith('s1', {
      overallScore: 4, passesBar: true, reviewNotesMarkdown: 'Solid work.', expectedReviewedAt: null,
    }));
  });

  it("echoes the user's own stored reviewedAt when editing", async () => {
    renderPanel({ review: makeReview({ reviewedByEmployerUserId: ME, reviewedAt: '2026-08-03T00:00:00.000Z' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Edit review' }));
    fireEvent.click(screen.getByRole('radio', { name: '5 — Exceptional' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(submitAssignmentReview.mock.calls[0][1]).toMatchObject({
      expectedReviewedAt: '2026-08-03T00:00:00.000Z',
    }));
  });

  it('tells the reviewer the notes are private to the team', () => {
    renderPanel();
    expect(screen.getByText(/Private to your team — never shown to the candidate/)).toBeTruthy();
  });

  it('becomes read-only with an Edit affordance after saving', async () => {
    renderPanel();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit review' })).toBeTruthy());
    expect(showToast).toHaveBeenCalledWith('success', 'Review saved.');
  });
});

describe('the 409 conflict', () => {
  const conflicting = makeReview({ reviewedByEmployerUserId: THEM, reviewedAt: '2026-08-04T11:00:00.000Z' });

  function throwConflict() {
    submitAssignmentReview.mockImplementation(async () => {
      throw new EmployerAssignmentReviewsApiError(409, 'REVIEW_CONFLICT', 'Another reviewer submitted a review.', {
        currentReview: conflicting,
        conflictingReviewer: { name: 'Rahul Menon', email: 'rahul@acme.test' },
      });
    });
  }

  async function triggerConflict() {
    throwConflict();
    renderPanel();
    fireEvent.click(screen.getByRole('radio', { name: '5 — Exceptional' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    fireEvent.change(screen.getByLabelText(/^Review notes/), { target: { value: 'My careful notes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }));
    await screen.findByRole('dialog');
  }

  it('opens the side-by-side dialog rather than a generic toast', async () => {
    await triggerConflict();
    expect(screen.getByRole('region', { name: 'Your review' })).toBeTruthy();
    expect(screen.getByRole('region', { name: "Rahul Menon's review" })).toBeTruthy();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('"Replace with mine" re-submits with the reviewedAt from the 409 body', async () => {
    await triggerConflict();
    submitAssignmentReview.mockImplementation(async () => makeReview({ reviewedByEmployerUserId: ME }));
    fireEvent.click(screen.getByRole('button', { name: 'Replace with mine' }));
    await waitFor(() => expect(submitAssignmentReview).toHaveBeenCalledTimes(2));
    expect(submitAssignmentReview.mock.calls[1][1]).toMatchObject({
      expectedReviewedAt: '2026-08-04T11:00:00.000Z',
      overallScore: 5,
      reviewNotesMarkdown: 'My careful notes.',
    });
  });

  it('"Keep theirs" closes with no second request and KEEPS the typed notes', async () => {
    await triggerConflict();
    fireEvent.click(screen.getByRole('button', { name: 'Keep theirs, discard mine' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(submitAssignmentReview).toHaveBeenCalledTimes(1);
    // Everything they typed is still in the form.
    expect((screen.getByLabelText(/^Review notes/) as HTMLTextAreaElement).value).toBe('My careful notes.');
    expect(screen.getByRole('radio', { name: '5 — Exceptional' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('role', () => {
  // The backend gate is requireInterviewerOrHigher — a review is semantically a note.
  it('the form is enabled with no role gating of its own', () => {
    renderPanel();
    expect((screen.getByRole('radio', { name: '3 — Meets bar' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText(/^Review notes/) as HTMLTextAreaElement).disabled).toBe(false);
  });
});

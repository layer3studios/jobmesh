// Each analytics call site fires exactly once with the right ids — and nothing else.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const {
  capture, listAssignments, cloneAssignment, archiveAssignment, createAssignment,
  listEmployerPostings, setPostingAssignment, getPostingAssignment, submitAssignmentReview,
} = vi.hoisted(() => ({
  capture: vi.fn(),
  listAssignments: vi.fn(),
  cloneAssignment: vi.fn(),
  archiveAssignment: vi.fn(),
  createAssignment: vi.fn(),
  listEmployerPostings: vi.fn(),
  setPostingAssignment: vi.fn(),
  getPostingAssignment: vi.fn(),
  submitAssignmentReview: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ viewerRole: 'owner', company: { id: 'c1' }, employerUser: { id: 'u-me' } }),
}));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  listAssignments, cloneAssignment, archiveAssignment, createAssignment,
}));
vi.mock('@/api/employer-jobs-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-jobs-api')>()),
  listEmployerPostings, setPostingAssignment, getPostingAssignment,
}));
vi.mock('@/api/employer-assignment-reviews-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignment-reviews-api')>()),
  submitAssignmentReview,
}));

import AssignmentsClient from '@/app/(employer)/employer/(app)/(onboarded)/assignments/AssignmentsClient';
import PostingForm from '@/components/employer/jobs/PostingForm';
import AssignmentReviewPanel from '@/components/employer/jobs/parts/AssignmentReviewPanel';
import { EmployerAssignmentReviewsApiError } from '@/api/employer-assignment-reviews-api';
import type { EmployerAssignment } from '@/types/employer-assignments';
import type { AssignmentSubmission, AssignmentReview } from '@/types/employer-applicants';

const assignment: EmployerAssignment = {
  id: 'a1', title: 'Build a rate limiter', publicSummary: 'Token bucket, with trade-offs.',
  descriptionMarkdown: '# Task'.padEnd(60, '.'), submissionInstructionsMarkdown: '',
  estimatedHours: 3, allowedFileTypes: ['pdf'],
  createdAt: null, updatedAt: null, archivedAt: null,
};

const eventsNamed = (name: string) => capture.mock.calls.filter(([called]) => called === name);

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  listAssignments.mockImplementation(async () => [assignment]);
  listEmployerPostings.mockImplementation(async () => []);
  getPostingAssignment.mockImplementation(async () => ({ assignment: null, applicationCount: 0 }));
  setPostingAssignment.mockImplementation(async () => ({
    posting: { id: 'j1' }, previousAssignmentId: null, applicationCount: 4,
  }));
});

// ── 8a: create / clone / archive ────────────────────────────────────────────
describe('8a library events', () => {
  function renderLibrary() {
    render(<AssignmentsClient assignments={[assignment]} usageByAssignmentId={{}} currentRole="owner" />);
  }

  it('assignment_cloned fires once with ids only', async () => {
    cloneAssignment.mockImplementation(async () => ({ ...assignment, id: 'a2', title: 'Build a rate limiter (copy)' }));
    renderLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'Clone' }));
    await waitFor(() => expect(eventsNamed('assignment_cloned')).toHaveLength(1));
    expect(eventsNamed('assignment_cloned')[0][1]).toEqual({ companyId: 'c1', assignmentId: 'a2' });
  });

  it('assignment_archived fires once with ids only', async () => {
    archiveAssignment.mockImplementation(async () => ({ ...assignment, archivedAt: '2026-08-04T00:00:00.000Z' }));
    renderLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(eventsNamed('assignment_archived')).toHaveLength(1));
    expect(eventsNamed('assignment_archived')[0][1]).toEqual({ companyId: 'c1', assignmentId: 'a1' });
  });

  it('assignment_created fires on create, carrying the hours but never the title', async () => {
    createAssignment.mockImplementation(async () => ({ ...assignment, id: 'a3', estimatedHours: 5 }));
    renderLibrary();
    fireEvent.click(screen.getByRole('button', { name: /New assignment/ }));
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Design a schema' } });
    fireEvent.change(screen.getByLabelText(/^Public summary/), { target: { value: 'Design a normalized schema for the domain.' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Design a schema and explain indexing.'.padEnd(60, '.') } });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));

    await waitFor(() => expect(eventsNamed('assignment_created')).toHaveLength(1));
    const payload = eventsNamed('assignment_created')[0][1];
    expect(payload).toEqual({ companyId: 'c1', assignmentId: 'a3', estimatedHours: 5 });
    expect(JSON.stringify(payload)).not.toContain('Design a schema');
  });

  // Editing is not creating; counting it as one would inflate library growth.
  it('editing an existing assignment does NOT fire assignment_created', async () => {
    renderLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(eventsNamed('assignment_created')).toHaveLength(0));
  });
});

// ── 8b: attach / detach ─────────────────────────────────────────────────────
describe('8b attachment events', () => {
  const VALID = {
    title: 'Backend Engineer',
    description: 'We are hiring a backend engineer for the ingestion pipeline.'.padEnd(60, '.'),
    location: 'Bengaluru',
  };

  it('assignment_attached fires once with the posting and assignment ids', async () => {
    render(
      <PostingForm
        submitLabel="Save changes" onSubmit={async () => {}}
        postingId="j1" initialAssignmentId={null}
        initialValues={{ ...VALID, workplaceType: 'remote', employmentType: 'full-time' }}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Require a take-home with this application' }));
    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(eventsNamed('assignment_attached')).toHaveLength(1));
    expect(eventsNamed('assignment_attached')[0][1]).toEqual({
      companyId: 'c1', postingId: 'j1', assignmentId: 'a1',
    });
  });

  it('assignment_detached carries the applicant count from the response', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment, applicationCount: 4 }));
    render(
      <PostingForm
        submitLabel="Save changes" onSubmit={async () => {}}
        postingId="j1" initialAssignmentId="a1"
        initialValues={{ ...VALID, workplaceType: 'remote', employmentType: 'full-time' }}
      />,
    );
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());
    await screen.findByLabelText(/^Assignment/);

    fireEvent.click(screen.getByRole('switch', { name: 'Require a take-home with this application' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove assignment' }));

    await waitFor(() => expect(eventsNamed('assignment_detached')).toHaveLength(1));
    expect(eventsNamed('assignment_detached')[0][1]).toEqual({
      companyId: 'c1', postingId: 'j1', applicationCount: 4,
    });
    expect(eventsNamed('assignment_attached')).toHaveLength(0);
  });
});

// ── 8c: review submitted / edited / conflicted ──────────────────────────────
describe('8c review events', () => {
  const submission: AssignmentSubmission = {
    id: 's1', applicationId: 'app1', jobId: 'j1',
    assignmentSnapshot: null, profileLinks: null, submittedAt: null,
    links: [], files: [], seekerNotesMarkdown: null, filesDeletedAt: null,
  };
  const myReview: AssignmentReview = {
    id: 'r1', assignmentSubmissionId: 's1', reviewedByEmployerUserId: 'u-me',
    reviewedAt: '2026-08-03T00:00:00.000Z', overallScore: 3, passesBar: true, reviewNotesMarkdown: 'ok',
  };

  function renderPanel(review: AssignmentReview | null = null) {
    render(<AssignmentReviewPanel submission={submission} review={review} currentEmployerUserId="u-me" />);
  }

  it('assignment_review_submitted carries the score and verdict, never the notes', async () => {
    submitAssignmentReview.mockImplementation(async () => ({ ...myReview, overallScore: 4 }));
    renderPanel();
    fireEvent.click(screen.getByRole('radio', { name: '4 — Strong' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    fireEvent.change(screen.getByLabelText(/^Review notes/), { target: { value: 'Private reviewer opinion.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }));

    await waitFor(() => expect(eventsNamed('assignment_review_submitted')).toHaveLength(1));
    const payload = eventsNamed('assignment_review_submitted')[0][1];
    expect(payload).toEqual({ companyId: 'c1', postingId: 'j1', overallScore: 4, passesBar: true });
    expect(JSON.stringify(payload)).not.toContain('Private reviewer opinion');
  });

  it('editing an own review fires assignment_review_edited, not _submitted', async () => {
    submitAssignmentReview.mockImplementation(async () => myReview);
    renderPanel(myReview);
    fireEvent.click(screen.getByRole('button', { name: 'Edit review' }));
    fireEvent.click(screen.getByRole('radio', { name: '5 — Exceptional' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(eventsNamed('assignment_review_edited')).toHaveLength(1));
    expect(eventsNamed('assignment_review_edited')[0][1]).toEqual({ companyId: 'c1', postingId: 'j1' });
    expect(eventsNamed('assignment_review_submitted')).toHaveLength(0);
  });

  async function triggerConflict() {
    submitAssignmentReview.mockImplementation(async () => {
      throw new EmployerAssignmentReviewsApiError(409, 'REVIEW_CONFLICT', 'Another reviewer saved first.', {
        currentReview: { ...myReview, reviewedByEmployerUserId: 'u-them', reviewedAt: '2026-08-04T10:00:00.000Z' },
        conflictingReviewer: { name: 'Rahul Menon', email: 'rahul@acme.test' },
      });
    });
    renderPanel();
    fireEvent.click(screen.getByRole('radio', { name: '5 — Exceptional' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }));
    await screen.findByRole('dialog');
  }

  // If conflicts turn out to be common, the review flow needs rethinking — and a
  // conflict resolved in the UI leaves no trace in Mongo, so this is the only signal.
  it('resolving by replacing records resolution: replaced', async () => {
    await triggerConflict();
    submitAssignmentReview.mockImplementation(async () => myReview);
    fireEvent.click(screen.getByRole('button', { name: 'Replace with mine' }));

    await waitFor(() => expect(eventsNamed('assignment_review_conflicted')).toHaveLength(1));
    expect(eventsNamed('assignment_review_conflicted')[0][1]).toEqual({
      companyId: 'c1', postingId: 'j1', resolution: 'replaced',
    });
  });

  it('keeping theirs records resolution: kept_theirs and makes no further request', async () => {
    await triggerConflict();
    const callsBefore = submitAssignmentReview.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Keep theirs, discard mine' }));

    await waitFor(() => expect(eventsNamed('assignment_review_conflicted')).toHaveLength(1));
    expect(eventsNamed('assignment_review_conflicted')[0][1]).toEqual({
      companyId: 'c1', postingId: 'j1', resolution: 'kept_theirs',
    });
    expect(submitAssignmentReview.mock.calls).toHaveLength(callsBefore);
  });
});

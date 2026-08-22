import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

const { listAssignments, listEmployerPostings, getPostingAssignment, setPostingAssignment } = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  listEmployerPostings: vi.fn(),
  getPostingAssignment: vi.fn(),
  setPostingAssignment: vi.fn(),
}));

vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  listAssignments,
}));
vi.mock('@/api/employer-jobs-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-jobs-api')>()),
  listEmployerPostings, getPostingAssignment, setPostingAssignment,
}));

import PostingForm from '@/components/employer/jobs/PostingForm';
import type { EmployerAssignment } from '@/types/employer-assignments';
import type { PostingCreateInput } from '@/types/employer-jobs';

const rateLimiter: EmployerAssignment = {
  id: 'a1', title: 'Build a rate limiter',
  publicSummary: 'Implement a token bucket and explain the trade-offs.',
  descriptionMarkdown: '# Task', submissionInstructionsMarkdown: '',
  estimatedHours: 3, allowedFileTypes: ['pdf'],
  createdAt: null, updatedAt: null, archivedAt: null,
};
const schema: EmployerAssignment = { ...rateLimiter, id: 'a2', title: 'Design a schema' };

const VALID = {
  title: 'Backend Engineer',
  description: 'We are hiring a backend engineer to work on our ingestion pipeline.'.padEnd(60, '.'),
  location: 'Bengaluru',
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/^Job title/), { target: { value: VALID.title } });
  fireEvent.change(screen.getByLabelText(/^Location/), { target: { value: VALID.location } });
  // Workplace and employment moved from selects to PillToggleGroup: each is a
  // role="group" of aria-pressed buttons, so these are clicks, not changes.
  fireEvent.click(within(screen.getByRole('group', { name: 'Workplace' })).getByText('Remote'));
  fireEvent.click(within(screen.getByRole('group', { name: 'Employment type' })).getByText('Full-time'));
  fireEvent.change(screen.getByLabelText(/^Job description/), { target: { value: VALID.description } });
}

const toggle = () => screen.getByRole('switch', { name: 'Require a take-home with this application' });
const submit = (label = 'Create posting') => screen.getByRole('button', { name: label });

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  listAssignments.mockImplementation(async () => [rateLimiter, schema]);
  listEmployerPostings.mockImplementation(async () => []);
  getPostingAssignment.mockImplementation(async () => ({ assignment: null, applicationCount: 0 }));
  setPostingAssignment.mockImplementation(async () => ({
    posting: { id: 'j1' }, previousAssignmentId: null, applicationCount: 0,
  }));
});

// ── Rule: a posting with the toggle off behaves exactly as before this chunk ──
describe('ZERO REGRESSION — toggle off', () => {
  it('sends NO assignment field and makes no assignment request', async () => {
    // Typed parameter so the payload assertion below reads off a real signature.
    const onSubmit = vi.fn(async (_input: PostingCreateInput) => ({ id: 'j1' }));
    render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} />);
    fillRequiredFields();
    fireEvent.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual([
      // applicationDeadline/autoCloseOnDeadline are always present (null/false when
      // unset) — still no assignment key, which is what this test guards.
      'applicationDeadline', 'autoCloseOnDeadline',
      'description', 'employmentType', 'location', 'title', 'workplaceType',
    ]);
    expect('assignmentId' in payload).toBe(false);
    expect(setPostingAssignment).not.toHaveBeenCalled();
  });

  it('makes no assignment request on the EDIT surface either', async () => {
    const onSubmit = vi.fn(async () => {});
    render(
      <PostingForm
        submitLabel="Save changes" onSubmit={onSubmit}
        postingId="j1" initialAssignmentId={null}
        initialValues={{ ...VALID, workplaceType: 'remote', employmentType: 'full-time' }}
      />,
    );
    fireEvent.click(submit('Save changes'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(setPostingAssignment).not.toHaveBeenCalled();
  });
});

// ── Create: posting first, then attach ───────────────────────────────────────
describe('create with an assignment', () => {
  it('creates the posting FIRST, then attaches with the new id', async () => {
    const order: string[] = [];
    const onSubmit = vi.fn(async () => { order.push('create'); return { id: 'new-1' }; });
    setPostingAssignment.mockImplementation(async () => {
      order.push('attach');
      return { posting: { id: 'new-1' }, previousAssignmentId: null, applicationCount: 0 };
    });
    const onSubmitted = vi.fn();

    render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} onSubmitted={onSubmitted} />);
    fillRequiredFields();
    fireEvent.click(toggle());
    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a1' } });
    fireEvent.click(submit());

    await waitFor(() => expect(setPostingAssignment).toHaveBeenCalledWith('new-1', 'a1'));
    expect(order).toEqual(['create', 'attach']);
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith({ id: 'new-1' }));
  });

  // Never a confirm on create — no posting existed, so nobody could have applied.
  it('never shows a confirm dialog', async () => {
    const onSubmit = vi.fn(async () => ({ id: 'new-1' }));
    render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} />);
    fillRequiredFields();
    fireEvent.click(toggle());
    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a1' } });
    fireEvent.click(submit());
    await waitFor(() => expect(setPostingAssignment).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a failed attach does NOT roll back the posting, offers a retry, and keeps the form', async () => {
    const onSubmit = vi.fn(async () => ({ id: 'new-1' }));
    const onSubmitted = vi.fn();
    setPostingAssignment.mockImplementation(async () => { throw new Error('network'); });

    render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} onSubmitted={onSubmitted} />);
    fillRequiredFields();
    fireEvent.click(toggle());
    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a1' } });
    fireEvent.click(submit());

    await screen.findByText('The posting was saved, but the assignment could not be attached.');
    // The posting exists: it was created exactly once and never un-created.
    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Not navigated away — the form is still here with everything the user typed.
    expect(onSubmitted).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/^Job title/) as HTMLInputElement).value).toBe(VALID.title);
    expect((screen.getByLabelText(/^Location/) as HTMLInputElement).value).toBe(VALID.location);
    expect(screen.getByRole('button', { name: 'Retry attaching' })).toBeTruthy();
  });

  it('the retry attaches without re-creating the posting', async () => {
    const onSubmit = vi.fn(async () => ({ id: 'new-1' }));
    const onSubmitted = vi.fn();
    setPostingAssignment.mockImplementationOnce(async () => { throw new Error('network'); });

    render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} onSubmitted={onSubmitted} />);
    fillRequiredFields();
    fireEvent.click(toggle());
    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a1' } });
    fireEvent.click(submit());
    await screen.findByRole('button', { name: 'Retry attaching' });

    setPostingAssignment.mockImplementation(async () => ({
      posting: { id: 'new-1' }, previousAssignmentId: null, applicationCount: 0,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry attaching' }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith({ id: 'new-1' }));
    expect(onSubmit).toHaveBeenCalledTimes(1); // posting created once, not twice
  });
});

// ── Edit: the confirm only when there is something to protect ────────────────
describe('edit surface', () => {
  function renderEdit() {
    const onSubmit = vi.fn(async () => {});
    const onSubmitted = vi.fn();
    render(
      <PostingForm
        submitLabel="Save changes" onSubmit={onSubmit} onSubmitted={onSubmitted}
        postingId="j1" initialAssignmentId="a1"
        initialValues={{ ...VALID, workplaceType: 'remote', employmentType: 'full-time' }}
      />,
    );
    return { onSubmit, onSubmitted };
  }

  it('a swap with ZERO applicants applies immediately, with no dialog', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment: rateLimiter, applicationCount: 0 }));
    const { onSubmit } = renderEdit();
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a2' } });
    fireEvent.click(submit('Save changes'));

    await waitFor(() => expect(setPostingAssignment).toHaveBeenCalledWith('j1', 'a2'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('a swap with 7 applicants opens the dialog, and Cancel makes NO api call', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment: rateLimiter, applicationCount: 7 }));
    const { onSubmit } = renderEdit();
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a2' } });
    fireEvent.click(submit('Save changes'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('7 people have applied');
    expect(dialog.textContent).toContain('Build a rate limiter');
    expect(dialog.textContent).toContain('Design a schema');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // Nothing saved at all — not the posting fields, not the attachment.
    expect(setPostingAssignment).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('confirming the dialog saves the posting and applies the swap', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment: rateLimiter, applicationCount: 7 }));
    const { onSubmit, onSubmitted } = renderEdit();
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/^Assignment/), { target: { value: 'a2' } });
    fireEvent.click(submit('Save changes'));
    fireEvent.click(await screen.findByRole('button', { name: 'Change assignment' }));

    await waitFor(() => expect(setPostingAssignment).toHaveBeenCalledWith('j1', 'a2'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
  });

  it('a DETACH with applicants shows the non-destructive detach copy', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment: rateLimiter, applicationCount: 7 }));
    renderEdit();
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());
    await screen.findByLabelText(/^Assignment/);

    fireEvent.click(toggle()); // turn the whole section off
    fireEvent.click(submit('Save changes'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Existing submissions stay reviewable.');
    expect(dialog.textContent).toContain('New applicants will see the plain apply form.');

    fireEvent.click(screen.getByRole('button', { name: 'Remove assignment' }));
    await waitFor(() => expect(setPostingAssignment).toHaveBeenCalledWith('j1', null));
  });

  it('saving with the assignment unchanged makes no assignment call', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment: rateLimiter, applicationCount: 7 }));
    const { onSubmit } = renderEdit();
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/^Job title/), { target: { value: 'Senior Backend Engineer' } });
    fireEvent.click(submit('Save changes'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(setPostingAssignment).not.toHaveBeenCalled();
  });
});

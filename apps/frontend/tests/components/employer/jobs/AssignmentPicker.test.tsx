import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { listAssignments, listEmployerPostings, createAssignment } = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  listEmployerPostings: vi.fn(),
  createAssignment: vi.fn(),
}));

vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  listAssignments, createAssignment,
}));
vi.mock('@/api/employer-jobs-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-jobs-api')>()),
  listEmployerPostings,
}));

import AssignmentPicker from '@/components/employer/jobs/parts/AssignmentPicker';
import type { EmployerAssignment } from '@/types/employer-assignments';
import type { Posting } from '@/types/employer-jobs';

function makeAssignment(overrides: Partial<EmployerAssignment> = {}): EmployerAssignment {
  return {
    id: 'a1', title: 'Build a rate limiter',
    publicSummary: 'Implement a token bucket and explain the trade-offs.',
    descriptionMarkdown: '# Task', submissionInstructionsMarkdown: '',
    estimatedHours: 3, allowedFileTypes: ['pdf'],
    createdAt: null, updatedAt: null, archivedAt: null,
    ...overrides,
  };
}

function makePosting(overrides: Partial<Posting>): Posting {
  return {
    id: 'j1', slug: 'job', title: 'Backend Engineer', description: '', descriptionPlain: '',
    location: 'Bengaluru', workplaceType: 'remote', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
    assignmentId: null, applicationDeadline: null, autoCloseOnDeadline: false,
    postedAt: null, closedAt: null, createdAt: '', updatedAt: '',
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof AssignmentPicker>> = {}) {
  const onChange = vi.fn();
  render(
    <AssignmentPicker
      value={props.value ?? null}
      attached={props.attached ?? null}
      postingId={props.postingId}
      onChange={props.onChange ?? onChange}
    />,
  );
  return { onChange };
}

const select = () => screen.getByLabelText(/^Assignment/) as HTMLSelectElement;

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  listAssignments.mockImplementation(async () => [makeAssignment()]);
  listEmployerPostings.mockImplementation(async () => []);
});

describe('option list', () => {
  it('requests active assignments only', async () => {
    renderPicker();
    await waitFor(() => expect(listAssignments).toHaveBeenCalledWith({ includeArchived: false }));
  });

  it('shows the title and estimated hours on each option', async () => {
    renderPicker();
    await screen.findByRole('option', { name: 'Build a rate limiter · ~3h' });
  });

  it('does not offer an archived assignment that is merely in the library', async () => {
    // The active list simply never contains it — attaching one is refused by the
    // backend with ASSIGNMENT_ARCHIVED, so offering it would be a dead end.
    listAssignments.mockImplementation(async () => [makeAssignment()]);
    renderPicker();
    await screen.findByRole('option', { name: /Build a rate limiter/ });
    expect(screen.queryByRole('option', { name: /Retired task/ })).toBeNull();
  });

  it('offers "Create new…"', async () => {
    renderPicker();
    await screen.findByRole('option', { name: '+ Create new…' });
  });
});

describe('attached-but-archived assignment', () => {
  const archived = makeAssignment({
    id: 'old', title: 'Retired task', archivedAt: '2026-02-01T00:00:00.000Z',
  });

  it('renders as the current value with an Archived badge and the replace note', async () => {
    renderPicker({ value: 'old', attached: archived });
    await screen.findByText('Archived');
    expect(screen.getByText(/Still shown to candidates\. Pick another to replace it\./)).toBeTruthy();
    // Never silently blanked — the option exists and is selected.
    expect(select().value).toBe('old');
    expect(screen.getByRole('option', { name: /Retired task .* \(archived\)/ })).toBeTruthy();
  });

  it('still lists the active assignments alongside it', async () => {
    renderPicker({ value: 'old', attached: archived });
    await screen.findByRole('option', { name: /Build a rate limiter/ });
  });
});

describe('preview panel', () => {
  it('shows the summary, hours and accepted formats', async () => {
    renderPicker({ value: 'a1' });
    await screen.findByText('Implement a token bucket and explain the trade-offs.');
    expect(screen.getByText('~3h')).toBeTruthy();
    expect(screen.getByText('PDF')).toBeTruthy();
  });

  it('says "Link only" when no file types are accepted', async () => {
    listAssignments.mockImplementation(async () => [makeAssignment({ allowedFileTypes: [] })]);
    renderPicker({ value: 'a1' });
    await screen.findByText('Link only');
  });

  it('counts other postings using the same assignment, excluding this one', async () => {
    listEmployerPostings.mockImplementation(async () => [
      makePosting({ id: 'j1', title: 'Backend Engineer', assignmentId: 'a1' }),
      makePosting({ id: 'j2', title: 'Platform Engineer', assignmentId: 'a1' }),
      makePosting({ id: 'j3', title: 'Designer', assignmentId: null }),
    ]);
    renderPicker({ value: 'a1', postingId: 'j1' });
    await screen.findByText(/Used by 1 other posting: Platform Engineer/);
  });

  it('says so when no other posting uses it', async () => {
    renderPicker({ value: 'a1', postingId: 'j1' });
    await screen.findByText('Not used by any other posting.');
  });
});

describe('create new', () => {
  it('opens the 8a modal and auto-selects the created assignment', async () => {
    const created = makeAssignment({ id: 'a2', title: 'Design a schema' });
    createAssignment.mockImplementation(async () => created);
    const { onChange } = renderPicker();
    await screen.findByRole('option', { name: '+ Create new…' });

    fireEvent.change(select(), { target: { value: '__create_new__' } });
    // The 8a form modal, not a second create form built here.
    await screen.findByRole('heading', { name: 'New assignment' });

    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Design a schema' } });
    fireEvent.change(screen.getByLabelText(/^Public summary/), {
      target: { value: 'Design a normalized schema for the provided domain.' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Design a normalized schema and explain your indexing choices.'.padEnd(60, '.') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('a2', created));
    // Refetched so the new row is in the list.
    await waitFor(() => expect(listAssignments).toHaveBeenCalledTimes(2));
  });

  it('selecting "Create new…" never reports it as a chosen assignment id', async () => {
    const { onChange } = renderPicker();
    await screen.findByRole('option', { name: '+ Create new…' });
    fireEvent.change(select(), { target: { value: '__create_new__' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('empty library', () => {
  it('shows a CTA instead of an empty dropdown', async () => {
    listAssignments.mockImplementation(async () => []);
    renderPicker();
    await screen.findByText('No assignments yet');
    expect(screen.queryByLabelText(/^Assignment/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Create an assignment' })).toBeTruthy();
  });

  it('the CTA opens the same 8a create modal', async () => {
    listAssignments.mockImplementation(async () => []);
    renderPicker();
    fireEvent.click(await screen.findByRole('button', { name: 'Create an assignment' }));
    await screen.findByRole('heading', { name: 'New assignment' });
  });
});

describe('load failure', () => {
  it('offers a retry and does not break the form', async () => {
    listAssignments.mockImplementation(async () => { throw new Error('network'); });
    renderPicker();
    await screen.findByText('Could not load your assignments.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});

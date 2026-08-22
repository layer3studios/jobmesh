import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { listAssignments, listEmployerPostings, getPostingAssignment } = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  listEmployerPostings: vi.fn(),
  getPostingAssignment: vi.fn(),
}));

vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  listAssignments,
}));
vi.mock('@/api/employer-jobs-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-jobs-api')>()),
  listEmployerPostings, getPostingAssignment,
}));

import AssignmentSection from '@/components/employer/jobs/parts/AssignmentSection';
import type { EmployerAssignment } from '@/types/employer-assignments';

const assignment: EmployerAssignment = {
  id: 'a1', title: 'Build a rate limiter',
  publicSummary: 'Implement a token bucket and explain the trade-offs.',
  descriptionMarkdown: '# Task', submissionInstructionsMarkdown: '',
  estimatedHours: 3, allowedFileTypes: ['pdf'],
  createdAt: null, updatedAt: null, archivedAt: null,
};

function renderSection(props: Partial<React.ComponentProps<typeof AssignmentSection>> = {}) {
  const onChange = vi.fn();
  render(
    <AssignmentSection
      postingId={props.postingId}
      initialAssignmentId={props.initialAssignmentId ?? null}
      applicationCount={props.applicationCount}
      onChange={props.onChange ?? onChange}
      onContextLoaded={props.onContextLoaded}
    />,
  );
  return { onChange };
}

const toggle = () => screen.getByRole('switch', { name: 'Require a take-home with this application' });

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  listAssignments.mockImplementation(async () => [assignment]);
  listEmployerPostings.mockImplementation(async () => []);
  getPostingAssignment.mockImplementation(async () => ({ assignment: null, applicationCount: 0 }));
});

describe('default state', () => {
  it('the toggle is OFF and the picker is not rendered', () => {
    renderSection();
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByLabelText(/^Assignment/)).toBeNull();
    expect(screen.queryByText(/Take-homes filter for commitment/)).toBeNull();
  });

  it('does not auto-enable just because assignments exist', async () => {
    renderSection();
    // Give any load a chance to land; the toggle must still be off.
    await waitFor(() => expect(toggle()).toBeTruthy());
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    // With the toggle off the picker never even fetches.
    expect(listAssignments).not.toHaveBeenCalled();
  });

  it('starts ON when a task is already attached — that is state, not a default', () => {
    renderSection({ postingId: 'j1', initialAssignmentId: 'a1' });
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });
});

describe('turning it on', () => {
  it('shows the drop-off notice and the picker', async () => {
    renderSection();
    fireEvent.click(toggle());
    expect(screen.getByText(/Take-homes filter for commitment but reduce applications/)).toBeTruthy();
    expect(screen.getByText(/Expect fewer,\s+more-invested candidates/)).toBeTruthy();
    await screen.findByLabelText(/^Assignment/);
  });

  it('reports the enabled state upward with no assignment chosen yet', () => {
    const { onChange } = renderSection();
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith({ enabled: true, assignmentId: null, assignmentTitle: null });
  });

  it('reports the chosen assignment and its title', async () => {
    const { onChange } = renderSection();
    fireEvent.click(toggle());
    const select = await screen.findByLabelText(/^Assignment/);
    fireEvent.change(select, { target: { value: 'a1' } });
    expect(onChange).toHaveBeenLastCalledWith({
      enabled: true, assignmentId: 'a1', assignmentTitle: 'Build a rate limiter',
    });
  });
});

describe('turning it off', () => {
  it('clears the selection so no invisible field decides what the posting does', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment, applicationCount: 7 }));
    const { onChange } = renderSection({ postingId: 'j1', initialAssignmentId: 'a1' });
    await waitFor(() => expect(getPostingAssignment).toHaveBeenCalled());

    fireEvent.click(toggle());
    expect(onChange).toHaveBeenLastCalledWith({ enabled: false, assignmentId: null, assignmentTitle: null });
    expect(screen.queryByLabelText(/^Assignment/)).toBeNull();
  });
});

describe('applicant context', () => {
  it('reads the count and attached task from the posting endpoint on the edit surface', async () => {
    getPostingAssignment.mockImplementation(async () => ({ assignment, applicationCount: 7 }));
    const onContextLoaded = vi.fn();
    renderSection({ postingId: 'j1', initialAssignmentId: 'a1', onContextLoaded });
    await waitFor(() => expect(onContextLoaded).toHaveBeenCalledWith({
      applicationCount: 7, attached: assignment,
    }));
  });

  it('never reads it on the create surface — there is no posting yet', () => {
    renderSection();
    expect(getPostingAssignment).not.toHaveBeenCalled();
  });

  it('surfaces the applicant count once the toggle is on', async () => {
    renderSection({ postingId: 'j1', initialAssignmentId: 'a1', applicationCount: 7 });
    await screen.findByText('7 people have already applied to this posting.');
  });

  it('is singular at one applicant', async () => {
    renderSection({ postingId: 'j1', initialAssignmentId: 'a1', applicationCount: 1 });
    await screen.findByText('1 person has already applied to this posting.');
  });

  it('a failed context read does not break the section', async () => {
    getPostingAssignment.mockImplementation(async () => { throw new Error('network'); });
    renderSection({ postingId: 'j1', initialAssignmentId: 'a1' });
    await screen.findByLabelText(/^Assignment/);
    expect(toggle()).toBeTruthy();
  });
});

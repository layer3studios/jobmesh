import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';

const {
  listAssignments, cloneAssignment, archiveAssignment, unarchiveAssignment, createAssignment, showToast,
} = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  cloneAssignment: vi.fn(),
  archiveAssignment: vi.fn(),
  unarchiveAssignment: vi.fn(),
  createAssignment: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  listAssignments, cloneAssignment, archiveAssignment, unarchiveAssignment, createAssignment,
}));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

let viewer: { viewerRole: string | null };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

import AssignmentsClient from '@/app/(employer)/employer/(app)/(onboarded)/assignments/AssignmentsClient';
import { EmployerAssignmentsApiError } from '@/api/employer-assignments-api';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

function makeAssignment(overrides: Partial<EmployerAssignment> = {}): EmployerAssignment {
  return {
    id: 'a1',
    title: 'Frontend take-home',
    publicSummary: 'Build a small dashboard widget from a provided API.',
    descriptionMarkdown: '# Task'.padEnd(60, '.'),
    submissionInstructionsMarkdown: '',
    estimatedHours: 2,
    allowedFileTypes: ['pdf'],
    createdAt: null,
    updatedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

const JOBS: AssignmentUsage[] = [
  { id: 'j1', title: 'Backend Engineer', status: 'active' },
  { id: 'j2', title: 'Platform Engineer', status: 'active' },
];

function renderPage(props: {
  assignments?: EmployerAssignment[];
  usage?: Record<string, AssignmentUsage[]>;
} = {}) {
  return render(
    <AssignmentsClient
      assignments={props.assignments ?? [makeAssignment()]}
      usageByAssignmentId={props.usage ?? {}}
      currentRole="owner"
    />,
  );
}

const statusCell = () => screen.getByText(/^(Active|Archived)$/);

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  viewer = { viewerRole: 'owner' };
  listAssignments.mockImplementation(async () => [makeAssignment()]);
});

describe('archive is not optimistic', () => {
  it('a 409 names the blocking postings and leaves the row untouched', async () => {
    archiveAssignment.mockImplementation(async () => {
      throw new EmployerAssignmentsApiError(
        409, 'CANNOT_ARCHIVE_USED_ASSIGNMENT',
        'This assignment is in use and cannot be archived.',
        { jobs: JOBS },
      );
    });
    renderPage();
    expect(statusCell().textContent).toBe('Active');

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    await screen.findByText('This assignment is in use and cannot be archived.');
    expect(screen.getByText('Used by: Backend Engineer, Platform Engineer')).toBeTruthy();
    // The row never flipped — no optimistic write to snap back from.
    expect(statusCell().textContent).toBe('Active');
    expect(screen.getByRole('button', { name: 'Clone it instead' })).toBeTruthy();
  });

  it('the row only becomes Archived AFTER the response resolves', async () => {
    let resolveArchive: (value: EmployerAssignment) => void = () => {};
    archiveAssignment.mockImplementation(() => new Promise((resolve) => { resolveArchive = resolve; }));

    renderPage();
    // Reveal archived rows first so the Active → Archived transition is observable
    // in one list, rather than the row simply leaving the default view.
    fireEvent.click(screen.getByLabelText('Show archived'));
    await waitFor(() => expect(listAssignments).toHaveBeenCalledWith({ includeArchived: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    // Request in flight: still Active. An optimistic implementation fails here.
    expect(statusCell().textContent).toBe('Active');
    expect(showToast).not.toHaveBeenCalled();

    await act(async () => {
      resolveArchive(makeAssignment({ archivedAt: '2026-03-01T00:00:00.000Z' }));
    });
    await waitFor(() => expect(statusCell().textContent).toBe('Archived'));
    expect(showToast).toHaveBeenCalledWith('success', 'Assignment archived.');
  });

  it('a non-409 failure leaves the row Active and toasts', async () => {
    archiveAssignment.mockImplementation(async () => {
      throw new EmployerAssignmentsApiError(500, null, 'Server error');
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('error', 'Server error'));
    expect(statusCell().textContent).toBe('Active');
  });
});

describe('unarchive', () => {
  it('restores the row from the response', async () => {
    unarchiveAssignment.mockImplementation(async () => makeAssignment({ archivedAt: null }));
    render(
      <AssignmentsClient
        assignments={[makeAssignment({ archivedAt: '2026-03-01T00:00:00.000Z' })]}
        usageByAssignmentId={{}}
        currentRole="owner"
      />,
    );
    fireEvent.click(screen.getByLabelText('Show archived'));
    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('success', 'Assignment restored.'));
  });
});

describe('create', () => {
  it('refetches the list so the new row appears', async () => {
    createAssignment.mockImplementation(async (input) => ({ ...makeAssignment(), ...input, id: 'a2' }));
    listAssignments.mockImplementation(async () => [
      makeAssignment(),
      makeAssignment({ id: 'a2', title: 'Backend take-home' }),
    ]);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /New assignment/ }));

    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Backend take-home' } });
    fireEvent.change(screen.getByLabelText(/^Public summary/), {
      target: { value: 'Design a small ingestion pipeline and explain the trade-offs.' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Build a small ingestion pipeline for the provided dataset.'.padEnd(60, '.') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));

    await waitFor(() => expect(createAssignment).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(listAssignments).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Backend take-home')).toBeTruthy());
  });
});

describe('clone', () => {
  it('clones and opens the copy for editing', async () => {
    cloneAssignment.mockImplementation(async () => makeAssignment({ id: 'a2', title: 'Frontend take-home (copy)' }));
    listAssignments.mockImplementation(async () => [
      makeAssignment(),
      makeAssignment({ id: 'a2', title: 'Frontend take-home (copy)' }),
    ]);
    renderPage({ usage: { a1: JOBS } });

    fireEvent.click(screen.getByRole('button', { name: 'Clone' }));
    await waitFor(() => expect(cloneAssignment).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'Edit assignment' })).toBeTruthy();
  });
});

describe('role gating on the page header', () => {
  it('interviewer: New assignment is rendered but disabled, with a visible reason', () => {
    viewer = { viewerRole: 'interviewer' };
    renderPage();
    const create = screen.getByRole('button', { name: /New assignment/ }) as HTMLButtonElement;
    expect(create).toBeTruthy();
    expect(create.disabled).toBe(true);
    expect(screen.getByText(/Only Members and above can create assignments\./)).toBeTruthy();
  });

  it('member: New assignment is enabled', () => {
    viewer = { viewerRole: 'member' };
    renderPage();
    expect((screen.getByRole('button', { name: /New assignment/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('falls back to the least-privileged role when neither source resolves', () => {
    viewer = { viewerRole: null };
    render(<AssignmentsClient assignments={[makeAssignment()]} usageByAssignmentId={{}} currentRole={null} />);
    expect((screen.getByRole('button', { name: /New assignment/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('read-only detail view', () => {
  it('View renders the locked assignment as text, not as disabled inputs', async () => {
    renderPage({ usage: { a1: JOBS } });
    fireEvent.click(screen.getByRole('button', { name: 'View' }));

    const dialog = await screen.findByRole('dialog');
    // No form controls at all inside the locked view — that is the whole point.
    expect(dialog.querySelectorAll('input, textarea, select')).toHaveLength(0);
    // Scoped to the dialog: the summary also appears as the table row's subtitle.
    expect(dialog.textContent).toContain('Public summary');
    expect(dialog.textContent).toContain('Build a small dashboard widget from a provided API.');
    expect(dialog.textContent).toContain('Editing is locked');
  });
});

describe('page header after the move out of Settings', () => {
  // The eyebrow above the heading read "SETTINGS" while this page lived under
  // settings/. It is now its own top-level nav section, so that label was simply
  // false — and it is the kind of staleness nothing else would catch, because no
  // assertion ever referenced it.
  it('shows no "Settings" eyebrow above the Assignments heading', () => {
    renderPage({});
    expect(screen.getByRole('heading', { name: 'Assignments' })).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.queryByText(/^SETTINGS$/i)).toBeNull();
  });

  it('names no settings route anywhere in the rendered page', () => {
    const { container } = renderPage({});
    expect(container.textContent).not.toMatch(/\bSettings\b/);
  });
});

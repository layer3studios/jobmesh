import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AssignmentsTable from '@/app/(employer)/employer/(app)/(onboarded)/assignments/parts/AssignmentsTable';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';
import type { Role } from '@/types/employer-team';

function makeAssignment(overrides: Partial<EmployerAssignment> = {}): EmployerAssignment {
  return {
    id: 'a1',
    title: 'Frontend take-home',
    publicSummary: 'Build a small dashboard widget.',
    descriptionMarkdown: '# Task',
    submissionInstructionsMarkdown: '',
    estimatedHours: 2,
    allowedFileTypes: ['pdf'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

const USAGE: AssignmentUsage[] = [
  { id: 'j1', title: 'Backend Engineer', status: 'active' },
  { id: 'j2', title: 'Platform Engineer', status: 'draft' },
];

const noop = () => {};

function renderTable(props: {
  assignments?: EmployerAssignment[];
  usage?: Record<string, AssignmentUsage[]>;
  role?: Role;
  showArchived?: boolean;
  onCreate?: () => void;
} = {}) {
  return render(
    <AssignmentsTable
      assignments={props.assignments ?? [makeAssignment()]}
      usageByAssignmentId={props.usage ?? {}}
      currentRole={props.role ?? 'owner'}
      showArchived={props.showArchived ?? false}
      busyId={null}
      onCreate={props.onCreate ?? noop}
      onEdit={noop}
      onView={noop}
      onClone={noop}
      onArchive={noop}
      onUnarchive={noop}
    />,
  );
}

/** Row actions live behind the ⋯ menu now, so every assertion opens it first. */
function openMenu(title = 'Frontend take-home') {
  fireEvent.click(screen.getByRole('button', { name: `Actions — ${title}` }));
}

// The accessible name of a blocked item includes its reason line, so match on the
// leading label rather than the whole string.
const item = (label: string) =>
  screen.getByRole('menuitem', { name: new RegExp(`^${label}`) }) as HTMLButtonElement;

beforeEach(() => cleanup());

describe('in-use rows', () => {
  it('renders Edit DISABLED with a visible reason and an enabled Clone — never hides it', () => {
    renderTable({ usage: { a1: USAGE } });
    openMenu();

    const edit = item('Edit');
    expect(edit).toBeTruthy();          // rendered, not removed
    expect(edit.disabled).toBe(true);   // and disabled

    // The reason is real text in the DOM, not only a tooltip: a tooltip is
    // unreachable on touch and invisible without a hover.
    expect(screen.getByText(
      'In use by 2 postings. Editing is locked so candidates answering it all see the same task. Clone it to make changes.',
    )).toBeTruthy();

    expect(item('Clone').disabled).toBe(false);
  });

  it('singularizes the reason for one posting', () => {
    renderTable({ usage: { a1: [USAGE[0]] } });
    openMenu();
    // Edit and Archive are blocked for different reasons, so both are stated.
    expect(screen.getByText(/^In use by 1 posting\. Editing is locked/)).toBeTruthy();
    expect(screen.getByText(/^In use by 1 posting\. Detach it/)).toBeTruthy();
  });

  it('lists the blocking posting titles in the Used by expander', () => {
    renderTable({ usage: { a1: USAGE } });
    expect(screen.getByText('2 postings')).toBeTruthy();
    expect(screen.getByText(/Backend Engineer/)).toBeTruthy();
    expect(screen.getByText(/Platform Engineer/)).toBeTruthy();
  });

  it('offers a View action for the read-only detail of a locked assignment', () => {
    renderTable({ usage: { a1: USAGE } });
    openMenu();
    expect(item('View')).toBeTruthy();
  });
});

describe('unused rows', () => {
  it('Edit is enabled and no reason is shown', () => {
    renderTable();
    openMenu();
    expect(item('Edit').disabled).toBe(false);
    expect(screen.queryByText(/Editing is locked/)).toBeNull();
  });

  it('shows an em dash in Used by', () => {
    renderTable();
    expect(screen.getByText('—')).toBeTruthy();
  });
});

// Mirrors employer-assignments-routes.js: view interviewer+, edit/clone member+,
// archive owner+.
describe('role gating', () => {
  it('interviewer: Edit and Clone are disabled with reasons, and Archive too', () => {
    renderTable({ role: 'interviewer' });
    openMenu();
    expect(item('Edit').disabled).toBe(true);
    expect(screen.getByText('Only Members and above can edit assignments.')).toBeTruthy();
    expect(item('Clone').disabled).toBe(true);
    expect(item('Archive').disabled).toBe(true);
  });

  it('member: Edit and Clone enabled, Archive disabled with the owner reason', () => {
    renderTable({ role: 'member' });
    openMenu();
    expect(item('Edit').disabled).toBe(false);
    expect(item('Clone').disabled).toBe(false);
    expect(item('Archive').disabled).toBe(true);
    expect(screen.getByText('Only Owners can archive assignments.')).toBeTruthy();
  });

  it('owner: Archive is enabled', () => {
    renderTable({ role: 'owner' });
    openMenu();
    expect(item('Archive').disabled).toBe(false);
  });

  it('founder: Archive is enabled', () => {
    renderTable({ role: 'founder' });
    openMenu();
    expect(item('Archive').disabled).toBe(false);
  });

  it('an in-use row reports the USAGE reason to a Member, not the role reason', () => {
    // Precedence: the lock applies to every role, so blaming permissions here would
    // send the Member to ask an Owner for something no Owner can do either.
    renderTable({ role: 'member', usage: { a1: USAGE } });
    openMenu();
    expect(screen.getByText(/Editing is locked/)).toBeTruthy();
    expect(screen.queryByText('Only Members and above can edit assignments.')).toBeNull();
  });
});

describe('archived rows', () => {
  const rows = [makeAssignment(), makeAssignment({ id: 'a2', title: 'Retired task', archivedAt: '2026-02-01T00:00:00.000Z' })];

  it('hides archived rows until the toggle is on', () => {
    renderTable({ assignments: rows, showArchived: false });
    expect(screen.getByText('Frontend take-home')).toBeTruthy();
    expect(screen.queryByText('Retired task')).toBeNull();
  });

  it('reveals them when showArchived is on, with an Archived badge and Unarchive', () => {
    renderTable({ assignments: rows, showArchived: true });
    expect(screen.getByText('Retired task')).toBeTruthy();
    expect(screen.getByText('Archived')).toBeTruthy();
    openMenu('Retired task');
    expect(item('Unarchive')).toBeTruthy();
  });

  // The "Show archived" control moved into the page header (AssignmentsClient), so
  // this component no longer owns it and no longer takes onToggleArchived.
});

describe('empty state', () => {
  it('renders the heading and the create CTA', () => {
    const onCreate = vi.fn();
    renderTable({ assignments: [], onCreate });
    expect(screen.getByText('No assignments yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Create your first assignment' }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('is also shown when every row is archived and the toggle is off', () => {
    renderTable({ assignments: [makeAssignment({ archivedAt: '2026-02-01T00:00:00.000Z' })] });
    expect(screen.getByText('No assignments yet')).toBeTruthy();
  });
});

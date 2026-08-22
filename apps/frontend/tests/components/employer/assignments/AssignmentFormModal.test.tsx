import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { createAssignment, updateAssignment } = vi.hoisted(() => ({
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
}));
vi.mock('@/api/employer-assignments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-assignments-api')>()),
  createAssignment,
  updateAssignment,
}));

import AssignmentFormModal from '@/app/(employer)/employer/(app)/(onboarded)/assignments/parts/AssignmentFormModal';
import { EmployerAssignmentsApiError } from '@/api/employer-assignments-api';
import type { EmployerAssignment } from '@/types/employer-assignments';

const source: EmployerAssignment = {
  id: 'a1',
  title: 'Frontend take-home',
  publicSummary: 'Build a small dashboard widget from a provided API.',
  descriptionMarkdown: '# The task\n\nBuild a widget.'.padEnd(60, '.'),
  submissionInstructionsMarkdown: 'Send a repo link.',
  estimatedHours: 2,
  allowedFileTypes: ['pdf'],
  createdAt: null,
  updatedAt: null,
  archivedAt: null,
};

function renderModal(props: Partial<React.ComponentProps<typeof AssignmentFormModal>> = {}) {
  return render(
    <AssignmentFormModal
      mode={props.mode ?? 'create'}
      source={props.source ?? null}
      onClose={props.onClose ?? (() => {})}
      onSaved={props.onSaved ?? (() => {})}
    />,
  );
}

const descriptionBox = () => screen.getByLabelText('Description') as HTMLTextAreaElement;
const previewTab = () => screen.getAllByRole('tab', { name: 'Preview' })[0];

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  createAssignment.mockImplementation(async (input) => ({ ...source, ...input, id: 'new-1' }));
  updateAssignment.mockImplementation(async (id, patch) => ({ ...source, ...patch, id }));
});

describe('markdown preview', () => {
  it('renders a markdown heading as a real h1 in the preview tab', () => {
    renderModal();
    fireEvent.change(descriptionBox(), { target: { value: '# Build a widget' } });
    fireEvent.click(previewTab());

    const heading = screen.getByRole('heading', { name: 'Build a widget' });
    expect(heading.tagName).toBe('H1');
  });

  // The shared renderer disables raw HTML, which is exactly why the validator is
  // allowed to accept a script tag in a code fence.
  it("renders '<script>' as text and creates no script element", () => {
    renderModal();
    fireEvent.change(descriptionBox(), {
      target: { value: '```html\n<script>alert(1)</script>\n```' },
    });
    fireEvent.click(previewTab());

    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeTruthy();
  });

  it('says so when there is nothing to preview', () => {
    renderModal();
    fireEvent.click(previewTab());
    expect(screen.getByText('Nothing to preview yet.')).toBeTruthy();
  });
});

describe('estimated hours', () => {
  it('4 hours shows the drop-off caution and still allows a submit', async () => {
    renderModal({ mode: 'edit', source });
    fireEvent.change(screen.getByLabelText('Estimated hours'), { target: { value: '4' } });

    expect(screen.getByText(/Longer tasks see sharply higher drop-off/i)).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    await waitFor(() => expect(updateAssignment).toHaveBeenCalledTimes(1));
    expect(updateAssignment.mock.calls[0][1]).toMatchObject({ estimatedHours: 4 });
  });

  it('3 hours shows no caution', () => {
    renderModal({ mode: 'edit', source });
    fireEvent.change(screen.getByLabelText('Estimated hours'), { target: { value: '3' } });
    expect(screen.queryByText(/higher drop-off/i)).toBeNull();
  });
});

describe('file types', () => {
  it('shows the link-only helper when nothing is checked', () => {
    renderModal();
    expect(screen.getByText('Link-only submission — candidates submit a URL.')).toBeTruthy();
  });

  it('drops the helper once a type is checked', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('PDF'));
    expect(screen.queryByText('Link-only submission — candidates submit a URL.')).toBeNull();
  });
});

describe('clone mode', () => {
  it('pre-fills every field and appends "(copy)" to the title', () => {
    renderModal({ mode: 'clone', source });
    expect((screen.getByLabelText(/^Title/) as HTMLInputElement).value).toBe('Frontend take-home (copy)');
    expect((screen.getByLabelText(/^Public summary/) as HTMLTextAreaElement).value).toBe(source.publicSummary);
    expect(descriptionBox().value).toBe(source.descriptionMarkdown);
    expect((screen.getByLabelText('PDF') as HTMLInputElement).checked).toBe(true);
  });

  it('creates a new assignment rather than patching the original', async () => {
    renderModal({ mode: 'clone', source });
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));
    await waitFor(() => expect(createAssignment).toHaveBeenCalledTimes(1));
    expect(updateAssignment).not.toHaveBeenCalled();
    expect(createAssignment.mock.calls[0][0].title).toBe('Frontend take-home (copy)');
  });

  it('edit mode does NOT append "(copy)"', () => {
    renderModal({ mode: 'edit', source });
    expect((screen.getByLabelText(/^Title/) as HTMLInputElement).value).toBe('Frontend take-home');
  });
});

describe('public-visibility notice', () => {
  it('tells the employer candidates can read the task before applying', () => {
    renderModal();
    expect(screen.getByText('Candidates can read this before applying. Assume it will be shared publicly.')).toBeTruthy();
  });

  it('labels the public summary as pre-apply content', () => {
    renderModal();
    expect(screen.getByText(/Shown on the job page before someone applies/)).toBeTruthy();
  });
});

describe('validation and server errors', () => {
  it('blocks a submit with an empty form and never calls the API', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));
    await waitFor(() => expect(screen.getByText(/Title must be 2-120 characters/)).toBeTruthy());
    expect(createAssignment).not.toHaveBeenCalled();
  });

  it('maps a 400 field code onto its field, not the form-level alert', async () => {
    updateAssignment.mockImplementation(async () => {
      throw new EmployerAssignmentsApiError(400, 'INVALID_PUBLIC_SUMMARY', 'Public summary must be 10-300 characters');
    });
    renderModal({ mode: 'edit', source });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    const message = await screen.findByText('Public summary must be 10-300 characters');
    // FieldShell renders a field error as role="alert" directly under its control.
    expect(message.getAttribute('role')).toBe('alert');
  });

  it('a 409 names the blocking postings', async () => {
    updateAssignment.mockImplementation(async () => {
      const err = new EmployerAssignmentsApiError(
        409, 'CANNOT_EDIT_USED_ASSIGNMENT',
        'This assignment is in use and cannot be edited. Clone it instead.',
        { jobs: [{ id: 'j1', title: 'Backend Engineer', status: 'active' }] },
      );
      throw err;
    });
    renderModal({ mode: 'edit', source });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText(/in use and cannot be edited/i)).toBeTruthy());
    expect(screen.getByText('Backend Engineer')).toBeTruthy();
  });

  it('a 403 is treated as our own bug and logged', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateAssignment.mockImplementation(async () => {
      throw new EmployerAssignmentsApiError(403, 'FORBIDDEN', 'Forbidden');
    });
    renderModal({ mode: 'edit', source });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText("You don't have permission to do this.")).toBeTruthy());
    expect(error).toHaveBeenCalled();
  });
});

// FILE: tests/components/employer/jobs/bulk-stage-move.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkMoveMenu from '@/components/employer/jobs/BulkMoveMenu';
import { ToastProvider } from '@/components/ui/Toast';
import type { Stage } from '@/types/employer-applicants';

const bulkMoveStage = vi.fn();
vi.mock('@/api/employer-applicant-actions-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicant-actions-api')>();
  return { ...actual, bulkMoveStage: (...args: unknown[]) => bulkMoveStage(...args) };
});

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Shortlisted', order: 2, isTerminal: false, isDefault: false, terminalType: null },
  { id: 's5', text: 'Hired', order: 5, isTerminal: true, isDefault: false, terminalType: 'hired' },
];

const onMoved = vi.fn();

function renderMenu() {
  render(
    <ToastProvider>
      <BulkMoveMenu stages={STAGES} selectedIds={new Set(['a1', 'a2', 'a3'])} onMoved={onMoved} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Move to/ }));
}

beforeEach(() => {
  bulkMoveStage.mockReset();
  onMoved.mockReset();
});

describe('BulkMoveMenu', () => {
  it('the dropdown shows non-terminal stage options only', () => {
    renderMenu();
    expect(screen.getByRole('menuitem', { name: 'Applied' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Shortlisted' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Hired' })).toBeNull(); // terminal excluded
  });

  it('selecting a stage calls the bulk-move API with the selection', async () => {
    bulkMoveStage.mockResolvedValue({ moved: 3, failed: 0, failures: [] });
    renderMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Shortlisted' }));
    await waitFor(() => expect(bulkMoveStage).toHaveBeenCalledWith(['a1', 'a2', 'a3'], 's2'));
    expect(onMoved).toHaveBeenCalled();
  });

  it('a full success shows the count toast', async () => {
    bulkMoveStage.mockResolvedValue({ moved: 3, failed: 0, failures: [] });
    renderMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Shortlisted' }));
    await waitFor(() => expect(screen.getByText('3 candidates moved to Shortlisted')).toBeTruthy());
  });

  it('a partial failure shows counts and a dismissible detail panel', async () => {
    bulkMoveStage.mockResolvedValue({
      moved: 2, failed: 1,
      failures: [{ applicationId: 'a3', reason: 'CANNOT_MOVE_ARCHIVED' }],
    });
    renderMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Applied' }));
    await waitFor(() => expect(screen.getByText('2 moved, 1 failed')).toBeTruthy());
    const panel = screen.getByRole('alert');
    expect(panel.textContent).toContain('1 candidate could not be moved');
    expect(panel.textContent).toContain('cannot move archived');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

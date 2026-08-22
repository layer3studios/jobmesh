// FILE: tests/components/employer/jobs/archive-rejection-email.test.tsx
// The "Send rejection email" toggle on the shared archive dialog.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkArchiveDialog from '@/components/employer/jobs/BulkArchiveDialog';
import type { ArchiveReason } from '@/types/employer-applicants';

const REASONS: ArchiveReason[] = [
  { id: 'r1', text: 'Not a fit', type: 'non-hired', status: 'active' },
];

const onConfirm = vi.fn();

function renderDialog() {
  render(
    <BulkArchiveDialog
      open selectedCount={2} reasons={REASONS} isSubmitting={false}
      onCancel={vi.fn()} onConfirm={onConfirm}
    />,
  );
}

beforeEach(() => { onConfirm.mockReset(); }); // braces: never return the mock from a hook

describe('Archive rejection-email toggle', () => {
  it('is ON by default with the send preview text', () => {
    renderDialog();
    const toggle = screen.getByRole('checkbox', { name: /Send rejection email/ }) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    expect(screen.getByText('A stage-appropriate rejection email will be sent.')).toBeTruthy();
  });

  it('the preview text updates when toggled off', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('checkbox', { name: /Send rejection email/ }));
    expect(screen.getByText('No email will be sent.')).toBeTruthy();
    expect(screen.queryByText('A stage-appropriate rejection email will be sent.')).toBeNull();
  });

  it('confirm passes skipEmail: false when ON and true when unchecked', () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'r1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Archive 2' }));
    expect(onConfirm).toHaveBeenCalledWith({ reasonId: 'r1', note: '', skipEmail: false });

    onConfirm.mockReset();
    fireEvent.click(screen.getByRole('checkbox', { name: /Send rejection email/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive 2' }));
    expect(onConfirm).toHaveBeenCalledWith({ reasonId: 'r1', note: '', skipEmail: true });
  });
});

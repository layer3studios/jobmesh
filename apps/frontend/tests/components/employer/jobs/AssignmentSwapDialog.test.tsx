import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AssignmentSwapDialog from '@/components/employer/jobs/parts/AssignmentSwapDialog';
import { buildSwapCopy, buildDetachCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';

const swapCopy = buildSwapCopy({
  currentTitle: 'Build a rate limiter', nextTitle: 'Design a schema', applicationCount: 7,
});

function renderDialog(overrides: Partial<React.ComponentProps<typeof AssignmentSwapDialog>> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <AssignmentSwapDialog
      copy={overrides.copy === undefined ? swapCopy : overrides.copy}
      isMutating={overrides.isMutating ?? false}
      onCancel={overrides.onCancel ?? onCancel}
      onConfirm={overrides.onConfirm ?? onConfirm}
    />,
  );
  return { onCancel, onConfirm };
}

beforeEach(() => cleanup());

describe('AssignmentSwapDialog', () => {
  it('renders nothing when there is no pending change', () => {
    renderDialog({ copy: null });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the applicant count and BOTH assignment titles', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('7 people have applied');
    expect(dialog.textContent).toContain('Build a rate limiter');
    expect(dialog.textContent).toContain('Design a schema');
  });

  it('titles the dialog with the specific question', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: 'Change the assignment on this posting?' })).toBeTruthy();
  });

  it('labels the confirm button with the action, not "Confirm"', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Change assignment' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });

  it('never says "Are you sure"', () => {
    renderDialog();
    expect(screen.getByRole('dialog').textContent).not.toMatch(/are you sure/i);
  });

  // The least-destructive action takes focus, so a stray Enter cancels.
  it('gives Cancel focus on open', () => {
    renderDialog();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('Escape cancels and never fires onConfirm', () => {
    const { onCancel, onConfirm } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Cancel fires only onCancel', () => {
    const { onCancel, onConfirm } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('the confirm button fires onConfirm', () => {
    const { onConfirm } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Change assignment' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('locks both actions while the request is in flight', () => {
    renderDialog({ isMutating: true });
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
  });

  // Deliberately not type-to-confirm: the action is reversible and existing
  // submissions are snapshot-protected.
  it('asks for no typed confirmation phrase', () => {
    renderDialog();
    expect(screen.getByRole('dialog').querySelectorAll('input, textarea')).toHaveLength(0);
  });

  it('renders the detach copy when detaching', () => {
    renderDialog({ copy: buildDetachCopy({ currentTitle: 'Build a rate limiter', applicationCount: 1 }) });
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('1 person has applied');
    expect(dialog.textContent).toContain('Existing submissions stay reviewable.');
    expect(screen.getByRole('button', { name: 'Remove assignment' })).toBeTruthy();
  });
});

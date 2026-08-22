import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(<Modal isOpen title="Title" onClose={() => {}}><p>Body content</p></Modal>);
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(<Modal isOpen={false} title="Title" onClose={() => {}}><p>Hidden</p></Modal>);
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('invokes onClose from the close button', () => {
    const onClose = vi.fn();
    render(<Modal isOpen title="Title" onClose={onClose}><p>Body</p></Modal>);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

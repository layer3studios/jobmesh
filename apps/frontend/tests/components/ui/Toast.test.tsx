import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function Trigger() {
  const { showToast } = useToast();
  return <button onClick={() => showToast('success', 'Saved!')}>push</button>;
}

describe('Toast', () => {
  it('shows a toast pushed via useToast()', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    expect(screen.queryByText('Saved!')).toBeNull();
    fireEvent.click(screen.getByText('push'));
    expect(screen.getByText('Saved!')).toBeTruthy();
  });
});

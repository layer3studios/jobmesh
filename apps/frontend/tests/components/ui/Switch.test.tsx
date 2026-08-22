import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '@/components/ui/Switch';

describe('Switch', () => {
  it('reflects the controlled checked state', () => {
    render(<Switch label="Dark mode" checked onChange={() => {}} />);
    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('fires onChange with toggled value', () => {
    const onChange = vi.fn();
    render(<Switch label="Dark mode" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

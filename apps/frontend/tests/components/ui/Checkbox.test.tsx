import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/Checkbox';

describe('Checkbox', () => {
  it('reflects the controlled checked state', () => {
    const { container } = render(<Checkbox label="Agree" checked onChange={() => {}} />);
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it('fires onChange with toggled value', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Agree" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByText('Agree'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

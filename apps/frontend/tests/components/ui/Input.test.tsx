import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders controlled value', () => {
    render(<Input value="hello" onChange={() => {}} />);
    const input = screen.getByDisplayValue('hello') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('fires onChange on input', () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} />);
    const input = document.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders a label when provided', () => {
    render(<Input label="Name" value="" onChange={() => {}} />);
    expect(screen.getByText('Name')).toBeTruthy();
  });
});

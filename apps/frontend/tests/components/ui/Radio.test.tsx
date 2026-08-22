import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Radio } from '@/components/ui/Radio';

const options = [
  { value: 'x', label: 'First' },
  { value: 'y', label: 'Second' },
];

describe('Radio', () => {
  it('reflects the controlled value', () => {
    const { container } = render(<Radio options={options} value="x" onChange={() => {}} />);
    const inputs = container.querySelectorAll('input[type="radio"]');
    expect((inputs[0] as HTMLInputElement).checked).toBe(true);
    expect((inputs[1] as HTMLInputElement).checked).toBe(false);
  });

  it('fires onChange with selected value', () => {
    const onChange = vi.fn();
    render(<Radio options={options} value="x" onChange={onChange} />);
    fireEvent.click(screen.getByText('Second'));
    expect(onChange).toHaveBeenCalledWith('y');
  });
});

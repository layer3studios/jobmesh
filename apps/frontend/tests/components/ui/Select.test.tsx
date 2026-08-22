import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Select } from '@/components/ui/Select';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

describe('Select', () => {
  it('renders options', () => {
    const { container } = render(<Select options={options} value="a" onChange={() => {}} />);
    const opts = container.querySelectorAll('option');
    const labels = Array.from(opts).map((o) => o.textContent);
    expect(labels).toContain('Apple');
    expect(labels).toContain('Banana');
  });

  it('reflects controlled value', () => {
    const { container } = render(<Select options={options} value="b" onChange={() => {}} />);
    const sel = container.querySelector('select') as HTMLSelectElement;
    expect(sel.value).toBe('b');
  });

  it('fires onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<Select options={options} value="a" onChange={onChange} />);
    const sel = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(sel, { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

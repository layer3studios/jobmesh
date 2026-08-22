import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('renders controlled value', () => {
    const { container } = render(<Textarea value="draft" onChange={() => {}} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.value).toBe('draft');
  });

  it('fires onChange on input', () => {
    const onChange = vi.fn();
    const { container } = render(<Textarea value="" onChange={onChange} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'typed' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

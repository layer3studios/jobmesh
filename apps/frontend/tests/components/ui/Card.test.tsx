import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>Card body</span></Card>);
    expect(screen.getByText('Card body')).toBeTruthy();
  });

  it('applies className passed to it', () => {
    const { container } = render(<Card className="mine">x</Card>);
    const el = container.querySelector('.card') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.className).toContain('mine');
  });
});

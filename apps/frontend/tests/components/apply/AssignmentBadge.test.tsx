import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssignmentBadge from '@/components/apply/AssignmentBadge';

describe('AssignmentBadge', () => {
  it('pluralises hours correctly', () => {
    const { container } = render(<AssignmentBadge estimatedHours={2} />);
    expect(container.textContent).toContain('Assignment · ~2 hrs');
  });

  it('uses the singular form for a single hour', () => {
    const { container } = render(<AssignmentBadge estimatedHours={1} />);
    expect(container.textContent).toContain('Assignment · 1 hr');
    expect(container.textContent).not.toContain('1 hrs');
    expect(container.textContent).not.toContain('~1');
  });

  it('size md lists the accepted formats in upper case', () => {
    render(<AssignmentBadge estimatedHours={4} allowedFileTypes={['pdf', 'zip']} size="md" />);
    expect(screen.getByText('Accepts PDF, ZIP')).toBeTruthy();
  });

  it('size md with no file types says Link submission', () => {
    // An empty array is a real configuration (link-only), not missing data.
    render(<AssignmentBadge estimatedHours={3} allowedFileTypes={[]} size="md" />);
    expect(screen.getByText('Link submission')).toBeTruthy();
  });

  it('size sm renders no format text at all', () => {
    const { container } = render(
      <AssignmentBadge estimatedHours={2} allowedFileTypes={['pdf']} size="sm" />,
    );
    expect(container.textContent).toContain('~2 hrs');
    expect(container.textContent).not.toContain('Accepts');
    expect(container.textContent).not.toContain('PDF');
    expect(container.textContent).not.toContain('Link submission');
  });

  it('defaults to the small size', () => {
    const { container } = render(<AssignmentBadge estimatedHours={2} allowedFileTypes={['pdf']} />);
    expect(container.textContent).not.toContain('Accepts');
  });

  it('uses theme variables, never hardcoded colours', () => {
    const { container } = render(<AssignmentBadge estimatedHours={2} />);
    expect(container.innerHTML).toContain('var(--accent-soft)');
    expect(container.innerHTML).toContain('var(--accent)');
  });
});

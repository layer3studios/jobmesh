import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssignmentPreview from '@/components/apply/AssignmentPreview';
import type { PublicAssignment } from '@/types/public-apply';

const FULL_DESCRIPTION = [
  '# Build a rate limiter',
  '',
  'Implement a token-bucket limiter with the following properties:',
  '',
  '- 100 requests per minute per key',
  '- burst capacity of 20',
  '',
  '```js',
  'const limiter = createLimiter({ capacity: 20 });',
  '```',
  '',
  'Explain your eviction strategy in the README.',
].join('\n');

const ASSIGNMENT: PublicAssignment = {
  id: 'a1',
  title: 'Build a rate limiter',
  publicSummary: 'A focused backend exercise, about half a day of work.',
  descriptionMarkdown: FULL_DESCRIPTION,
  submissionInstructionsMarkdown: 'Send us a public repo link.',
  estimatedHours: 4,
  allowedFileTypes: ['pdf', 'zip'],
};

describe('AssignmentPreview', () => {
  it('renders the title, summary and the callout', () => {
    const { container } = render(<AssignmentPreview assignment={ASSIGNMENT} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Build a rate limiter');
    expect(container.textContent).toContain('A focused backend exercise, about half a day of work.');
    expect(container.textContent).toContain('complete as part of applying');
    expect(container.textContent).toContain('no separate step');
  });

  it('renders the badge with hours and accepted formats', () => {
    const { container } = render(<AssignmentPreview assignment={ASSIGNMENT} />);
    expect(container.textContent).toContain('~4 hrs');
    expect(container.textContent).toContain('Accepts PDF, ZIP');
  });

  // The no-fake-gate regression: <details> is a UX affordance, not a lock. The
  // whole task must be in the DOM, un-truncated, on first render.
  it('has the FULL descriptionMarkdown in the DOM', () => {
    const { container } = render(<AssignmentPreview assignment={ASSIGNMENT} />);
    expect(container.textContent).toContain('Implement a token-bucket limiter');
    expect(container.textContent).toContain('100 requests per minute per key');
    expect(container.textContent).toContain('burst capacity of 20');
    expect(container.textContent).toContain('const limiter = createLimiter({ capacity: 20 });');
    expect(container.textContent).toContain('Explain your eviction strategy in the README.');
    expect(container.textContent).not.toContain('…');
  });

  it('renders the description as markdown, not as literal source', () => {
    const { container } = render(<AssignmentPreview assignment={ASSIGNMENT} />);
    // The '# ' and '```' markers are consumed by the renderer.
    expect(container.querySelector('pre')).toBeTruthy();
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.textContent).not.toContain('```js');
  });

  it('uses a native <details> that is closed by default', () => {
    const { container } = render(<AssignmentPreview assignment={ASSIGNMENT} />);
    const details = container.querySelector('details');
    expect(details).toBeTruthy();
    expect(details?.hasAttribute('open')).toBe(false);
    expect(container.querySelector('summary')?.textContent).toBe('Preview the full task');
  });

  it('does not inject raw HTML from the description', () => {
    const hostile: PublicAssignment = {
      ...ASSIGNMENT,
      descriptionMarkdown: 'Task <script>alert(1)</script> and <img src=x onerror=alert(1)>',
    };
    const { container } = render(<AssignmentPreview assignment={hostile} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});

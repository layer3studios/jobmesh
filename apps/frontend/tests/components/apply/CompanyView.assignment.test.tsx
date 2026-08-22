import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import CompanyView from '@/components/apply/CompanyView';
import type { PublicCompany, PublicJobSummary } from '@/types/public-apply';

const COMPANY: PublicCompany = {
  name: 'Acme', tagline: null, about: null, socialLinks: null,
  slug: 'acme', website: null, logoUrl: null,
};

function job(overrides: Partial<PublicJobSummary> = {}): PublicJobSummary {
  return {
    id: 'j1', slug: 'react-dev', title: 'React Developer',
    location: 'Bengaluru', employmentType: 'full-time',
    workplaceType: null, postedAt: null, assignment: null,
    ...overrides,
  };
}

describe('CompanyView — assignment badge', () => {
  it('shows the badge with hours for a job that has an assignment', () => {
    const { container } = render(
      <CompanyView
        company={COMPANY}
        jobs={[job({ assignment: { estimatedHours: 2, allowedFileTypes: ['pdf'] } })]}
      />,
    );
    expect(container.textContent).toContain('Assignment · ~2 hrs');
  });

  it('shows no badge for a job without an assignment, and keeps the card otherwise identical', () => {
    const { container } = render(<CompanyView company={COMPANY} jobs={[job()]} />);
    expect(container.textContent).not.toContain('Assignment');

    // Everything the row rendered before this chunk is still exactly there.
    expect(container.textContent).toContain('React Developer');
    expect(container.textContent).toContain('Bengaluru · full-time');
    expect(container.querySelectorAll('.careers-role')).toHaveLength(1);
    const link = container.querySelector('a[href="/apply/acme/react-dev?source=careers"]');
    expect(link).toBeTruthy();
  });

  it('renders exactly one badge across a mixed list of three jobs', () => {
    const { container } = render(
      <CompanyView
        company={COMPANY}
        jobs={[
          job({ id: 'j1', slug: 'a', title: 'A' }),
          job({ id: 'j2', slug: 'b', title: 'B', assignment: { estimatedHours: 3, allowedFileTypes: [] } }),
          job({ id: 'j3', slug: 'c', title: 'C' }),
        ]}
      />,
    );
    const badges = container.textContent?.match(/Assignment · /g) ?? [];
    expect(badges).toHaveLength(1);
    expect(container.textContent).toContain('Assignment · ~3 hrs');
    // All three rows still render.
    expect(container.querySelectorAll('.careers-role')).toHaveLength(3);
  });

  it('never shows accepted formats on the list surface (badge data only)', () => {
    const { container } = render(
      <CompanyView
        company={COMPANY}
        jobs={[job({ assignment: { estimatedHours: 4, allowedFileTypes: ['pdf', 'zip'] } })]}
      />,
    );
    expect(container.textContent).not.toContain('Accepts');
    expect(container.textContent).not.toContain('Link submission');
  });

  it('renders the empty state unchanged when there are no jobs', () => {
    const { container } = render(<CompanyView company={COMPANY} jobs={[]} />);
    expect(container.textContent).toContain('No open positions');
    expect(container.textContent).not.toContain('Assignment');
  });
});

import { describe, it, expect } from 'vitest';
import { buildCompanySchema } from '@/lib/schema';

describe('buildCompanySchema', () => {
  it('returns an Organization plus a JobPosting ItemList', () => {
    const { organization, jobList } = buildCompanySchema({
      name: 'Acme',
      slug: 'acme',
      jobs: [
        { jobSlug: 'react-dev', title: 'React Dev' },
        { jobSlug: 'backend-dev', title: 'Backend Dev' },
      ],
    });

    const org = organization as Record<string, unknown>;
    const list = jobList as { '@type': string; itemListElement: Array<{ url: string; position: number }> };

    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('Acme');
    expect(list['@type']).toBe('ItemList');
    expect(list.itemListElement).toHaveLength(2);
    expect(list.itemListElement[0].url.endsWith('/apply/acme/react-dev')).toBe(true);
    expect(list.itemListElement[1].position).toBe(2);
  });
});

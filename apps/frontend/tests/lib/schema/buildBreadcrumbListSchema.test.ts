import { describe, it, expect } from 'vitest';
import { buildBreadcrumbListSchema } from '@/lib/schema';

describe('buildBreadcrumbListSchema', () => {
  it('outputs ordered breadcrumb items with names and absolute items', () => {
    const schema = buildBreadcrumbListSchema([
      { name: 'Jobs', path: '/jobs' },
      { name: 'Acme', path: '/apply/acme' },
    ]) as { '@type': string; itemListElement: Array<{ position: number; name: string; item: string }> };

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Jobs');
    expect(schema.itemListElement[1].item.endsWith('/apply/acme')).toBe(true);
  });
});

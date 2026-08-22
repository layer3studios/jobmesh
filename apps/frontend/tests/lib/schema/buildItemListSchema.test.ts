import { describe, it, expect } from 'vitest';
import { buildItemListSchema } from '@/lib/schema';

describe('buildItemListSchema', () => {
  it('outputs an itemListElement array with 1-based positions', () => {
    const schema = buildItemListSchema([
      { path: '/jobs/a', name: 'A' },
      { path: '/jobs/b', name: 'B' },
    ]) as { '@type': string; itemListElement: Array<{ position: number; url: string; name?: string }> };

    expect(schema['@type']).toBe('ItemList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[0].name).toBe('A');
  });

  it('keeps absolute URLs and absolutises site-relative paths', () => {
    const schema = buildItemListSchema([
      { path: 'https://example.com/x' },
      { path: '/jobs/y' },
    ]) as { itemListElement: Array<{ url: string }> };
    expect(schema.itemListElement[0].url).toBe('https://example.com/x');
    expect(schema.itemListElement[1].url.endsWith('/jobs/y')).toBe(true);
  });
});

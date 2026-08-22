import { describe, it, expect } from 'vitest';
import { buildOrganizationSchema } from '@/lib/schema';

describe('buildOrganizationSchema', () => {
  it('outputs @type, name and url', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('JobMesh');
    expect(typeof schema.url).toBe('string');
  });

  it('honours a provided name and keeps an absolute http logo as-is', () => {
    const schema = buildOrganizationSchema({
      name: 'Acme',
      logoPath: 'https://logo.dev/acme.com',
    }) as Record<string, unknown>;
    expect(schema.name).toBe('Acme');
    expect(schema.logo).toBe('https://logo.dev/acme.com');
  });
});

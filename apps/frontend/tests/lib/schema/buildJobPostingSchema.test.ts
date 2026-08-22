import { describe, it, expect } from 'vitest';
import { buildJobPostingSchema } from '@/lib/schema';

describe('buildJobPostingSchema', () => {
  const job = {
    title: 'Senior React Engineer',
    descriptionHtml: '<p>Build things</p>',
    postedAt: '2026-07-01',
    validThrough: '2026-08-31T00:00:00.000Z',
    employmentType: 'FULL_TIME',
    companySlug: 'acme',
    location: 'Bengaluru',
  };

  it('emits every Google-required JobPosting field', () => {
    const schema = buildJobPostingSchema(job, { name: 'Acme' }) as Record<string, unknown>;
    expect(schema['@type']).toBe('JobPosting');
    expect(schema.title).toBe('Senior React Engineer');
    expect(schema.description).toBe('<p>Build things</p>');
    expect(schema.datePosted).toBe('2026-07-01');
    expect(schema.validThrough).toBe('2026-08-31T00:00:00.000Z');
    expect(schema.employmentType).toBe('FULL_TIME');
    expect(schema.hiringOrganization).toBeTruthy();
    expect(schema.jobLocation).toBeTruthy();
  });

  it('omits baseSalary when no salary is present', () => {
    const schema = buildJobPostingSchema(job, { name: 'Acme' }) as Record<string, unknown>;
    expect('baseSalary' in schema).toBe(false);
  });

  it('includes baseSalary when a salary is present', () => {
    const schema = buildJobPostingSchema(
      { ...job, salary: { minValue: 2500000, maxValue: 4000000, currency: 'INR' } },
      { name: 'Acme' },
    ) as Record<string, unknown>;
    expect(schema.baseSalary).toBeTruthy();
  });
});

import { describe, expect, it } from 'vitest';
import { buildJobPostingSchema, normalizeEmploymentType } from '../../src/lib/schema/job-posting';

const BASE = { title: 'Engineer', descriptionHtml: '<p>x</p>', postedAt: '2026-09-01', validThrough: '2026-11-01', companySlug: 'acme' };

describe('buildJobPostingSchema', () => {
  it('marks a scraped listing as not direct-apply and omits the careers sameAs', () => {
    const schema = buildJobPostingSchema({ ...BASE, directApply: false }, { name: 'Acme', sameAs: null });
    expect(schema.directApply).toBe(false);
    expect(schema.hiringOrganization).not.toHaveProperty('sameAs');
  });

  it('keeps native postings direct-apply with a careers sameAs', () => {
    const schema = buildJobPostingSchema(BASE, { name: 'Acme' });
    expect(schema.directApply).toBe(true);
    expect(schema.hiringOrganization).toHaveProperty('sameAs');
  });

  it('flags remote roles as TELECOMMUTE for India', () => {
    const schema = buildJobPostingSchema({ ...BASE, isRemote: true }, { name: 'Acme' });
    expect(schema.jobLocationType).toBe('TELECOMMUTE');
    expect(schema.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'India' });
  });
});

describe('normalizeEmploymentType', () => {
  it.each([
    ['Full-time', 'FULL_TIME'], ['full time', 'FULL_TIME'], ['Part-time', 'PART_TIME'],
    ['Contract', 'CONTRACTOR'], ['Internship', 'INTERN'], [null, 'FULL_TIME'], ['Permanent', 'FULL_TIME'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeEmploymentType(raw)).toBe(expected);
  });
});

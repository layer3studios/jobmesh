import { describe, expect, it } from 'vitest';
import { buildFaqPageSchema, buildTechJobFaq } from '../../src/lib/seo/tech-job-faq';
import { findTechJobPage } from '../../src/lib/seo/tech-job-pages';
import type { IJob } from '../../src/types';

const job = (over: Partial<IJob>): IJob => ({
  _id: Math.random().toString(36), JobID: 'x', JobTitle: 'Engineer', Company: 'Acme', Location: 'Pune',
  ApplicationURL: 'https://acme.example/jobs/1', PostedDate: null, ...over,
});

describe('buildTechJobFaq', () => {
  const page = findTechJobPage('it-jobs-in-pune')!;
  const asOf = new Date('2026-09-28T00:00:00Z');

  it('answers from live data: count, companies, remote share', () => {
    const jobs = [job({ Company: 'Acme' }), job({ Company: 'Zeta', IsRemote: true })];
    const faq = buildTechJobFaq(page, jobs, 2, asOf);
    expect(faq[0].answer).toContain('2 open roles');
    expect(faq.find(f => f.question.startsWith('Which companies'))?.answer).toContain('Acme and Zeta');
    expect(faq.find(f => f.question.startsWith('Are any'))?.answer).toContain('1 of the 2');
  });

  it('gives a salary answer only with at least 3 yearly INR salaries', () => {
    const paid = [10, 20, 30].map(l => job({ SalaryMin: l * 100_000, SalaryMax: l * 100_000, SalaryCurrency: 'INR' }));
    expect(buildTechJobFaq(page, paid.slice(0, 2), 2, asOf).some(f => f.question.startsWith('What salary'))).toBe(false);
    const salary = buildTechJobFaq(page, paid, 3, asOf).find(f => f.question.startsWith('What salary'));
    expect(salary?.answer).toContain('₹20 LPA');
  });

  it('ignores non-INR and monthly salaries', () => {
    const jobs = [
      job({ SalaryMin: 100_000, SalaryCurrency: 'USD' }),
      job({ SalaryMin: 900_000, SalaryInterval: 'month' }),
      job({ SalaryMin: 1_000_000 }),
    ];
    expect(buildTechJobFaq(page, jobs, 3, asOf).some(f => f.question.startsWith('What salary'))).toBe(false);
  });

  it('emits valid FAQPage JSON-LD', () => {
    const schema = buildFaqPageSchema([{ question: 'Q?', answer: 'A.' }]);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('A.');
  });
});

// FILE: src/lib/seo/tech-job-faq.ts
// Question-and-answer block for each /tech-jobs landing page, built from the
// live listings — so every answer is a current, checkable fact (counts,
// companies, disclosed salaries), never boilerplate. AI answer engines
// (ChatGPT search, Perplexity, Google AI Overviews) quote short, direct Q&A,
// and the same pairs are emitted as FAQPage JSON-LD.
import type { IJob } from '../../types';
import type { TechJobPage } from './tech-job-pages';

export interface FaqItem { question: string; answer: string }

const LAKH = 100_000;

/** Yearly INR salaries only — the only ones comparable across listings. */
function yearlyInrSalaries(jobs: IJob[]): number[] {
  const values: number[] = [];
  for (const job of jobs) {
    const currency = (job.SalaryCurrency ?? 'INR').toUpperCase();
    const interval = (job.SalaryInterval ?? 'year').toLowerCase();
    if (currency !== 'INR' || !/year|annual|annum/.test(interval)) continue;
    const mid = job.SalaryMin != null && job.SalaryMax != null
      ? (job.SalaryMin + job.SalaryMax) / 2
      : job.SalaryMin ?? job.SalaryMax;
    // Drop obvious unit mistakes (monthly figures, or values already in lakhs).
    if (mid != null && mid >= 1 * LAKH && mid <= 2_00 * LAKH) values.push(mid);
  }
  return values.sort((a, b) => a - b);
}

const lpa = (value: number) => `₹${(value / LAKH).toFixed(value < 10 * LAKH ? 1 : 0)} LPA`;

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function buildTechJobFaq(page: TechJobPage, jobs: IJob[], totalJobs: number, asOf: Date): FaqItem[] {
  const subject = page.kind === 'city' ? `IT jobs in ${page.label}` : page.heading.replace(/^./, c => c.toLowerCase());
  const date = asOf.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const companies = [...new Set(jobs.map(job => job.Company))];
  const faq: FaqItem[] = [];

  faq.push({
    question: `How many ${subject} are open right now?`,
    answer: totalJobs > 0
      ? `As of ${date}, JobMesh lists ${totalJobs} open ${totalJobs === 1 ? 'role' : 'roles'} for ${subject}, collected from company careers pages and refreshed every day.`
      : `There are no matching openings listed on ${date}. New roles are added daily from company careers pages.`,
  });

  if (companies.length > 0) {
    faq.push({
      question: `Which companies are hiring for ${subject}?`,
      answer: `Companies currently hiring include ${listNames(companies.slice(0, 8))}${companies.length > 8 ? `, among ${companies.length} employers in total` : ''}.`,
    });
  }

  const salaries = yearlyInrSalaries(jobs);
  if (salaries.length >= 3) {
    const median = salaries[Math.floor(salaries.length / 2)];
    faq.push({
      question: `What salary do ${subject} pay?`,
      answer: `Of the listings that disclose pay, the midpoint salaries run from ${lpa(salaries[0])} to ${lpa(salaries[salaries.length - 1])}, with a median of about ${lpa(median)} a year. Most employers do not publish salaries, so treat this as a guide from ${salaries.length} listings.`,
    });
  }

  if (page.kind !== 'mode' && jobs.length > 0) {
    const remote = jobs.filter(job => job.IsRemote).length;
    faq.push({
      question: `Are any ${subject} remote?`,
      answer: remote > 0
        ? `Yes — ${remote} of the ${jobs.length} listings shown here are remote. See all remote roles at jobmesh.in/tech-jobs/remote-jobs-in-india.`
        : `None of the ${jobs.length} listings shown here are fully remote right now. Remote roles are collected at jobmesh.in/tech-jobs/remote-jobs-in-india.`,
    });
  }

  faq.push({
    question: 'How do I apply?',
    answer: 'Open a listing and use its apply link: it goes straight to the employer\'s own application page. JobMesh does not charge candidates and there is no recruiter in between.',
  });

  return faq;
}

export function buildFaqPageSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

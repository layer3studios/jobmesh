// JSON-LD JobPosting builder (SEO-PLAN §2 — Google for Jobs, critical). Pure.
// Required fields per schema.org/JobPosting + Google Search Central: title,
// description, datePosted, validThrough, employmentType, hiringOrganization,
// jobLocation. Optional baseSalary is emitted ONLY when a salary is present
// (never emit null — Google drops postings with malformed fields).
import { absoluteUrl } from '../site-url';

export interface JobPostingSchemaInput {
  title: string;
  descriptionHtml: string;
  postedAt: string;
  validThrough: string;
  employmentType?: string;
  companySlug: string;
  location?: string;
  addressRegion?: string;
  salary?: { minValue?: number; maxValue?: number; currency?: string; unitText?: string } | null;
  isRemote?: boolean;
}

export interface JobPostingCompanyInput {
  name: string;
  logoUrl?: string;
}

export function buildJobPostingSchema(job: JobPostingSchemaInput, company: JobPostingCompanyInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.descriptionHtml,
    datePosted: job.postedAt,
    validThrough: job.validThrough,
    employmentType: job.employmentType ?? 'FULL_TIME',
    directApply: true,
    hiringOrganization: {
      '@type': 'Organization',
      name: company.name,
      sameAs: absoluteUrl(`/apply/${job.companySlug}`),
      ...(company.logoUrl ? { logo: company.logoUrl } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location ?? 'India',
        ...(job.addressRegion ? { addressRegion: job.addressRegion } : {}),
        addressCountry: 'IN',
      },
    },
  };

  if (job.salary && (job.salary.minValue != null || job.salary.maxValue != null)) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency ?? 'INR',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salary.minValue != null ? { minValue: job.salary.minValue } : {}),
        ...(job.salary.maxValue != null ? { maxValue: job.salary.maxValue } : {}),
        unitText: job.salary.unitText ?? 'YEAR',
      },
    };
  }

  if (job.isRemote) {
    schema.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
  }

  return schema;
}

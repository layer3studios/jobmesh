// JSON-LD JobPosting builder (SEO-PLAN §2 — Google for Jobs, critical). Pure.
// Required fields per schema.org/JobPosting + Google Search Central: title,
// description, datePosted, validThrough, employmentType, hiringOrganization,
// jobLocation. Optional baseSalary is emitted ONLY when a salary is present
// (never emit null — Google drops postings with malformed fields).
import { getApplyUrl } from '../subdomain-urls';

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
  /**
   * True only when the candidate applies ON JobMesh (native postings). Scraped
   * listings send people to the employer's own site, and Google's guidelines
   * treat a false `directApply: true` as misrepresentation. Default true.
   */
  directApply?: boolean;
}

export interface JobPostingCompanyInput {
  name: string;
  logoUrl?: string;
  /**
   * The organisation's own URL. Defaults to its careers page on apply.jobmesh.in,
   * which only exists for native companies; pass null for scraped ones.
   */
  sameAs?: string | null;
}

const GOOGLE_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'];

/**
 * Map a scraped ATS value ("Full-time", "Contract", "Internship"...) onto
 * Google's fixed enum. Anything unrecognised becomes FULL_TIME, the common
 * case, rather than a value Google rejects.
 */
export function normalizeEmploymentType(raw?: string | null): string {
  const value = (raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (GOOGLE_EMPLOYMENT_TYPES.includes(value)) return value;
  if (/INTERN/.test(value)) return 'INTERN';
  if (/PART/.test(value)) return 'PART_TIME';
  if (/CONTRACT|FREELANCE/.test(value)) return 'CONTRACTOR';
  if (/TEMP|SEASONAL/.test(value)) return 'TEMPORARY';
  return 'FULL_TIME';
}

export function buildJobPostingSchema(job: JobPostingSchemaInput, company: JobPostingCompanyInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.descriptionHtml,
    datePosted: job.postedAt,
    validThrough: job.validThrough,
    employmentType: normalizeEmploymentType(job.employmentType),
    directApply: job.directApply ?? true,
    hiringOrganization: {
      '@type': 'Organization',
      name: company.name,
      ...(company.sameAs === null ? {} : { sameAs: company.sameAs ?? getApplyUrl(`/${job.companySlug}`) }),
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
    // Google needs BOTH for a remote role: the telecommute flag, and where
    // applicants may live. Without jobLocationType it is listed as on-site.
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
  }

  return schema;
}

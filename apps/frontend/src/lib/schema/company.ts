// JSON-LD builder for a company careers page (SEO-PLAN §2, D8): an Organization
// plus an ItemList of its open JobPostings. Pure function → plain object.
import { buildOrganizationSchema } from './organization';
import { buildItemListSchema } from './item-list';

export interface CompanySchemaInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  jobs: { jobSlug: string; title: string }[];
}

export function buildCompanySchema(company: CompanySchemaInput) {
  const organization = {
    ...buildOrganizationSchema({
      name: company.name,
      description: company.description,
      logoPath: company.logoUrl,
    }),
  };
  const jobList = buildItemListSchema(
    company.jobs.map((job) => ({
      path: `/apply/${company.slug}/${job.jobSlug}`,
      name: job.title,
    })),
  );
  return { organization, jobList };
}

// FILE: src/app/(seeker)/jobs/[jobId]/page.tsx
// Job detail — Server Component. The Google-for-Jobs win: renders JobPosting +
// BreadcrumbList JSON-LD and per-route metadata. Data is a scraped IJob listing.
// NOTE: IJob has no explicit expiry field, so validThrough falls back to postedAt
// + 60 days (flagged in the chunk report); wire a real expiry when the backend
// exposes one.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../../components/schema/JsonLd';
import { buildJobPostingSchema, buildBreadcrumbListSchema } from '../../../../lib/schema';
import { getSeekerJobServer } from '../../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../../lib/site-url';
import JobDetailStandalone from '../../../../components/seeker/JobDetailPanel/JobDetailStandalone';
import type { IJob } from '../../../../types';

export const revalidate = 3600; // D_impl_3

const VALID_THROUGH_FALLBACK_DAYS = 60;

function validThroughFrom(postedDate: string | null): string {
  const base = postedDate ? new Date(postedDate) : new Date();
  const valid = new Date(base);
  valid.setDate(valid.getDate() + VALID_THROUGH_FALLBACK_DAYS);
  return valid.toISOString();
}

export async function generateMetadata(
  { params }: { params: Promise<{ jobId: string }> },
): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getSeekerJobServer(jobId).catch(() => null);
  if (!job) return { title: 'Job not found' };
  return {
    title: `${job.JobTitle} at ${job.Company}`,
    description: (job.DescriptionPlain ?? job.Description ?? '').slice(0, 155),
    alternates: { canonical: absoluteUrl(`/jobs/${jobId}`) },
    openGraph: { type: 'article', title: `${job.JobTitle} at ${job.Company}` },
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job: IJob | null = await getSeekerJobServer(jobId).catch(() => null);
  if (!job) notFound();

  const jobPostingSchema = buildJobPostingSchema(
    {
      title: job.JobTitle,
      descriptionHtml: job.Description ?? '',
      postedAt: job.PostedDate ?? new Date().toISOString(),
      validThrough: validThroughFrom(job.PostedDate),
      employmentType: job.ContractType ?? 'FULL_TIME',
      companySlug: job.Company,
      location: job.Location,
      salary: job.SalaryMin != null || job.SalaryMax != null
        ? {
            minValue: job.SalaryMin ?? undefined,
            maxValue: job.SalaryMax ?? undefined,
            currency: job.SalaryCurrency ?? 'INR',
          }
        : null,
      isRemote: job.IsRemote ?? false,
    },
    { name: job.Company },
  );
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Jobs', path: '/jobs' },
    { name: job.JobTitle, path: `/jobs/${jobId}` },
  ]);

  return (
    <main className="container-lg" style={{ padding: '32px 16px' }}>
      <JsonLd schema={jobPostingSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <JobDetailStandalone job={job} />
    </main>
  );
}

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
import Link from 'next/link';
import { slugifyCompanyName } from '../../../../utils/slugify-company';

export const revalidate = 3600; // D_impl_3

const VALID_THROUGH_FALLBACK_DAYS = 60;

function validThroughFrom(postedDate: string | null): string {
  const base = postedDate ? new Date(postedDate) : new Date();
  const valid = new Date(base);
  valid.setDate(valid.getDate() + VALID_THROUGH_FALLBACK_DAYS);
  return valid.toISOString();
}

/** First city of a job's location string ("Bengaluru, Karnataka, India" → "Bengaluru"). */
function primaryCity(job: IJob): string {
  if (job.IsRemote) return 'Remote';
  return (job.Location ?? '').split(/[,;|/]/)[0]?.trim() ?? '';
}

/**
 * "Senior Backend Engineer at Razorpay, Bengaluru", kept to ~60 characters
 * (the layout adds "| JobMesh"). Google truncates longer titles; the old
 * `title at company` ran past 70 on most listings.
 */
function jobMetaTitle(job: IJob): string {
  const city = primaryCity(job);
  const full = `${job.JobTitle} at ${job.Company}${city ? `, ${city}` : ''}`;
  if (full.length <= 60) return full;
  const withoutCity = `${job.JobTitle} at ${job.Company}`;
  if (withoutCity.length <= 60) return withoutCity;
  return `${job.JobTitle.slice(0, 57 - job.Company.length).trimEnd()}… at ${job.Company}`.slice(0, 64);
}

/**
 * A readable 150-160 character summary. The old one sliced raw ATS HTML when
 * there was no plain-text copy, so tags and entities leaked into Google's snippet.
 */
function jobMetaDescription(job: IJob): string {
  const city = primaryCity(job);
  const lead = `${job.Company} is hiring a ${job.JobTitle}${city && city !== 'Remote' ? ` in ${city}` : city === 'Remote' ? ' (remote)' : ''}. `;
  const body = (job.DescriptionPlain || (job.Description ?? '').replace(/<[^>]+>/g, ' '))
    .replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const text = `${lead}${body}`;
  return text.length <= 158 ? text : `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ jobId: string }> },
): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getSeekerJobServer(jobId).catch(() => null);
  if (!job) return { title: 'Job not found', robots: { index: false } };
  const title = jobMetaTitle(job);
  const description = jobMetaDescription(job);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/jobs/${jobId}`) },
    openGraph: { type: 'article', title, description, url: absoluteUrl(`/jobs/${jobId}`) },
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
      // Scraped listing: the candidate applies on the employer's site, not here.
      directApply: false,
    },
    // No apply.jobmesh.in careers page exists for a scraped company.
    { name: job.Company, sameAs: null },
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
      <nav aria-label="More jobs" style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-muted)' }}>
        More roles: <Link href={`/company/${slugifyCompanyName(job.Company)}`}>all {job.Company} jobs</Link>
        {' · '}<Link href="/tech-jobs">tech jobs by city and role</Link>
      </nav>
    </main>
  );
}

// FILE: src/app/(apply)/apply/[companySlug]/[jobSlug]/page.tsx
// Job apply page — Server shell (fetches job + company, renders JobPosting +
// BreadcrumbList JSON-LD + metadata) hosting the client <ApplyForm> island. This
// is the internal apply funnel (PublicJob), the primary Google-for-Jobs surface.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/schema/JsonLd';
import ApplyFormClient from '@/components/apply/ApplyFormClient';
import AssignmentPreview from '@/components/apply/AssignmentPreview';
import ApplyClosedNotice from '@/components/apply/ApplyClosedNotice';
import { isDeadlinePassed } from '@/components/employer/jobs/deadline-helpers';
import { buildJobPostingSchema, buildBreadcrumbListSchema } from '@/lib/schema';
import { getPublicJobServer } from '@/lib/server-api/public';
import { absoluteUrl } from '@/lib/site-url';
import { ServerFetchError } from '@/lib/server-fetch';

export const revalidate = 3600;

const VALID_THROUGH_FALLBACK_DAYS = 60;

function validThroughFrom(postedAt: string | null): string {
  const base = postedAt ? new Date(postedAt) : new Date();
  const valid = new Date(base);
  valid.setDate(valid.getDate() + VALID_THROUGH_FALLBACK_DAYS);
  return valid.toISOString();
}

async function loadJob(companySlug: string, jobSlug: string) {
  try {
    return await getPublicJobServer(companySlug, jobSlug);
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ companySlug: string; jobSlug: string }> },
): Promise<Metadata> {
  const { companySlug, jobSlug } = await params;
  const data = await loadJob(companySlug, jobSlug);
  if (!data) return { title: 'Job not found' };
  // Surfaced in the title so the time cost is visible in search results and the
  // browser tab, before the candidate has invested any attention. The description
  // and JSON-LD are deliberately untouched — an assignment is not part of the
  // JobPosting schema, and inventing a field risks the whole listing.
  const assignmentSuffix = data.assignment ? ' · Includes a take-home' : '';
  return {
    title: `${data.job.title} at ${data.company.name}${assignmentSuffix}`,
    description: (data.job.description ?? '').slice(0, 155),
    alternates: { canonical: absoluteUrl(`/apply/${companySlug}/${jobSlug}`) },
    openGraph: { type: 'article', title: `${data.job.title} at ${data.company.name}` },
  };
}

export default async function ApplyJobPage(
  { params }: { params: Promise<{ companySlug: string; jobSlug: string }> },
) {
  const { companySlug, jobSlug } = await params;
  const data = await loadJob(companySlug, jobSlug);
  if (!data) notFound();
  const { company, job, assignment } = data;

  // Decided on the SERVER: a candidate whose deadline has passed never receives the
  // form at all, so there is nothing to fill in and nothing to disable. The apply
  // endpoint enforces the same rule with a 410 for the race where it passes
  // between this render and submit.
  if (isDeadlinePassed(job.applicationDeadline)) {
    return (
      <ApplyClosedNotice
        companySlug={companySlug}
        companyName={company.name}
        jobTitle={job.title}
      />
    );
  }

  const jobPostingSchema = buildJobPostingSchema(
    {
      title: job.title,
      descriptionHtml: job.description,
      postedAt: job.postedAt ?? new Date().toISOString(),
      validThrough: validThroughFrom(job.postedAt),
      employmentType: job.employmentType,
      companySlug,
      location: job.location,
      salary: job.salaryMin != null || job.salaryMax != null
        ? { minValue: job.salaryMin ?? undefined, maxValue: job.salaryMax ?? undefined, currency: job.salaryCurrency }
        : null,
      isRemote: job.workplaceType === 'remote',
    },
    { name: company.name, logoUrl: company.logoUrl ?? undefined },
  );
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Jobs', path: '/jobs' },
    { name: company.name, path: `/apply/${companySlug}` },
    { name: job.title, path: `/apply/${companySlug}/${jobSlug}` },
  ]);

  return (
    <>
      <JsonLd schema={jobPostingSchema} />
      <JsonLd schema={breadcrumbSchema} />
      {/* AssignmentPreview is a Server Component, so it is passed as an ALREADY
          RENDERED element rather than a component prop — a client island cannot
          re-render one. ApplyFormClient drops it into the JD column, inside the
          page's single centred wrapper. There is deliberately no wrapper here:
          the hand-copied maxWidth/padding 7a needed is gone, and the layout
          constants now live in exactly one file. */}
      <ApplyFormClient
        company={company}
        job={job}
        companySlug={companySlug}
        jobSlug={jobSlug}
        assignment={assignment}
        assignmentPreview={assignment ? <AssignmentPreview assignment={assignment} /> : null}
      />
    </>
  );
}

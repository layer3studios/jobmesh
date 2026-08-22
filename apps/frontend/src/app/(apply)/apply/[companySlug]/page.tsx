// FILE: src/app/(apply)/apply/[companySlug]/page.tsx
// Company mini careers page — Server Component, public. Renders Organization +
// ItemList (of open JobPostings) JSON-LD and per-route metadata.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/schema/JsonLd';
import CompanyView from '@/components/apply/CompanyView';
import { buildCompanySchema } from '@/lib/schema';
import { getPublicCompanyServer } from '@/lib/server-api/public';
import { absoluteUrl } from '@/lib/site-url';
import { ServerFetchError } from '@/lib/server-fetch';

export const revalidate = 3600;

async function loadCompany(companySlug: string) {
  try {
    return await getPublicCompanyServer(companySlug);
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ companySlug: string }> },
): Promise<Metadata> {
  const { companySlug } = await params;
  const data = await loadCompany(companySlug);
  if (!data) return { title: 'Company not found' };
  return {
    title: `${data.company.name} — open roles`,
    description: `Open roles at ${data.company.name}. Apply directly on JobMesh.`,
    alternates: { canonical: absoluteUrl(`/apply/${companySlug}`) },
    openGraph: { type: 'profile', title: `${data.company.name} — open roles` },
  };
}

export default async function ApplyCompanyPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  const data = await loadCompany(companySlug);
  if (!data) notFound();

  const { organization, jobList } = buildCompanySchema({
    name: data.company.name,
    slug: data.company.slug,
    logoUrl: data.company.logoUrl ?? undefined,
    jobs: data.jobs.map((job) => ({ jobSlug: job.slug, title: job.title })),
  });

  return (
    <>
      <JsonLd schema={organization} />
      <JsonLd schema={jobList} />
      <CompanyView company={data.company} jobs={data.jobs} />
    </>
  );
}

// FILE: src/app/sitemap.ts — SEO-PLAN §3. Dynamic sitemap: static seeker-public
// routes + every scraped job detail + every directory company. Revalidates hourly
// (D_impl_3). Public reads, so a missing cookie is fine; a backend hiccup degrades
// to just the static routes rather than failing the build/request.
import type { MetadataRoute } from 'next';
import { getSeekerJobsServer, getSeekerDirectoryServer } from '@/lib/server-api/seeker';
import { slugifyCompanyName } from '@/utils/slugify-company';
import { absoluteUrl } from '@/lib/site-url';

export const revalidate = 3600;

const STATIC_PATHS = ['/', '/jobs', '/directory', '/legal', '/legal/privacy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.7,
  }));

  try {
    const [jobs, companies] = await Promise.all([getSeekerJobsServer(), getSeekerDirectoryServer()]);
    for (const job of jobs) {
      entries.push({
        url: absoluteUrl(`/jobs/${job._id}`),
        lastModified: job.PostedDate ?? undefined,
        changeFrequency: 'daily',
        priority: 0.6,
      });
    }
    for (const company of companies) {
      entries.push({
        url: absoluteUrl(`/company/${slugifyCompanyName(company.companyName)}`),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // Degrade to static routes only if the backend is unreachable.
  }

  return entries;
}

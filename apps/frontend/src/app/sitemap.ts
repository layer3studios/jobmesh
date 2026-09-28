// FILE: src/app/sitemap.ts — SEO-PLAN §3. Dynamic sitemap: static seeker-public
// routes + every scraped job detail + every directory company. Revalidates hourly
// (D_impl_3). Public reads, so a missing cookie is fine; a backend hiccup degrades
// to just the static routes rather than failing the build/request.
import type { MetadataRoute } from 'next';
import { getAllSeekerJobsServer, getSeekerDirectoryServer } from '@/lib/server-api/seeker';
import { TECH_JOB_PAGES } from '@/lib/seo/tech-job-pages';
import { BLOG_POSTS } from '@/content/blog/posts';
import { getPublicProfileSlugsServer } from '@/lib/server-api/public-profile';
import { slugifyCompanyName } from '@/utils/slugify-company';
import { absoluteUrl } from '@/lib/site-url';

export const revalidate = 3600;

// The landing pages (/find-work, /companies, /hire) and the SEO hubs were
// missing here, so Google only found them by following links.
const STATIC_PATHS = [
  '/', '/jobs', '/find-work', '/companies', '/hire', '/directory', '/tech-jobs', '/blog',
  '/legal', '/legal/privacy',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.7,
  }));
  for (const page of TECH_JOB_PAGES) {
    entries.push({ url: absoluteUrl(`/tech-jobs/${page.slug}`), changeFrequency: 'daily', priority: 0.8 });
  }
  for (const post of BLOG_POSTS) {
    entries.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  try {
    const [jobs, companies] = await Promise.all([getAllSeekerJobsServer(), getSeekerDirectoryServer()]);
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

  // Published candidate profiles. Listed in their own try so a failure here costs
  // the sitemap its profiles, not its jobs.
  try {
    for (const slug of await getPublicProfileSlugsServer()) {
      entries.push({
        url: absoluteUrl(`/u/${slug}`),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // No profiles in the sitemap this hour. They are still crawlable by link.
  }

  return entries;
}

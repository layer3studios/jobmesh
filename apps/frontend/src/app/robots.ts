// FILE: src/app/robots.ts — SEO-PLAN §4 + NAMING-CONVENTIONS §17. Index the public
// funnel; block auth/utility surfaces. The apply FORM pages stay indexable
// (Google-for-Jobs landing); only the post-submit /apply/*/success is disallowed.
//
// robots.txt is per-HOST, and one Next process serves five hosts, so the rules
// must depend on which subdomain asked. health.* and api.* are operational
// surfaces with nothing to index; hire.* and admin.* are behind auth entirely.
import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

/** Hosts where nothing at all should be crawled. */
const FULLY_DISALLOWED_SUBDOMAINS = ['health', 'api', 'admin', 'hire'];

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Set by middleware.ts on every proxied request; absent in dev (no subdomains).
  const subdomain = (await headers()).get('x-subdomain') ?? '';

  if (FULLY_DISALLOWED_SUBDOMAINS.includes(subdomain)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  // apply.jobmesh.in: careers + job pages are the whole point of the host, so
  // they stay crawlable — only the post-submit confirmation is hidden.
  if (subdomain === 'apply') {
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/*/success', '/interview/'] },
      sitemap: absoluteUrl('/sitemap.xml'),
    };
  }

  // Bare domain (seeker), and every dev request.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/employer/',
        '/admin/',
        '/today',
        '/resume',
        '/profile',
        '/account/',
        '/login',
        '/status',
        '/apply/*/success',
        // /u/{slug} is deliberately NOT here: shareable candidate profiles are
        // public by their owner's explicit choice and should be indexable. A
        // profile turned off exports noindex from its own metadata.
        // Booking tokens are live credentials — never crawled. The page ALSO
        // exports noindex metadata: robots.txt alone cannot stop indexing of a
        // URL linked from elsewhere.
        '/interview/',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}

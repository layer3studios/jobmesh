// FILE: src/app/robots.ts — SEO-PLAN §4. Index the public funnel; block auth/utility
// surfaces. The apply FORM pages stay indexable (Google-for-Jobs landing); only the
// post-submit /apply/*/success is disallowed.
import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/employer/',
        '/admin/',
        '/today',
        '/progress',
        '/resume',
        '/profile',
        '/account/',
        '/login',
        '/apply/*/success',
        // Booking tokens are live credentials — never crawled. The page ALSO
        // exports noindex metadata: robots.txt alone cannot stop indexing of a
        // URL linked from elsewhere.
        '/interview/',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
